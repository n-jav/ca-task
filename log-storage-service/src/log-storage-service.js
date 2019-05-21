/**
 * This file provides the main module of log-storage-service.
 * It provides storage feature for storing logs received from the ingest service.
 * The service starts a websocket server over which it accepts log messages in Google Buffer Protocol, on reception
 * it sorts the log messages based on timestamp and saves them to a file which is rotated every hour.
 *
 * @author Nadir Javed
 * @version 1.0.0
 */

"use strict";

// Setting the process name
process.title = 'log-storage-service';

// Load configurations from file
const config = require("./config.json");

// Google Protocol Buffer message handler generated using the GBP protoc compiler.
var pb = require('./sensor_log_message_pb.js');

// File manager module
var fileManager = require("./file-management.js");

// Quicksort library used for sorting the incoming log messages
// based on timestamp. Quicksort is a more efficient and faster method of sorting
// than the built-in JavaScript sorting method.
var quickSort = require('optimized-quicksort');

// Create the HTTP server required by the WebSockets server,
// HTTP is only required for establishing the websocket connection.
var http = require('http');
var webSocketServer = require('websocket').server;

// Maintains the log messages received in the current hour as an array for sorting
var logMessagesArray = [];

// Maintains the current hour at which the application was started, on hour change
// the logMessagesArray should be cleared as we rotate the logs file every hour.
var currentDate = new Date();
var currentHour = currentDate.getUTCHours();

// Boolean for using as a file lock mechanism to avoid multiple writes at the same time.
var fileLock = false;
// Boolean to be used for queuing the next write operation, if file is locked.
var nextWrite = false;

/**
 * This method is used for comparing two log messages based on timestamp. It is utilized by
 * Quicksort library for sorting the logs array.
 * @param logMsgA First log message to be compared.
 * @param logMsgB Second log message to be compared.
 * @return int: 1 if logMsgA has later timestamp than logMsgB.
 *         int: -1 if logMsgA has earlier timestamp than logMsgB.
 *         int: 0 if comparision could not happen.
 */
function timestampComparision (logMsgA,logMsgB)
{
    if (logMsgA.timeStamp.getTime() < logMsgB.timeStamp.getTime())
        return -1;
    else if (logMsgA.timeStamp.getTime() > logMsgB.timeStamp.getTime())
        return 1;
    else
        return 0;
}

/**
 * This method is used for determining if the client address requesting to connect is allowed in config.json.
 * @param origin This parameter contains the remote address trying to establish connection.
 * @return Boolean: ture if connection is allowed else Boolean:false
 */
function originIsAllowed(origin) {
    if(origin === config.ALLOWED_CLIENT_ADDRESS)
        return true;
    else
        return false;
}

/**
 * This method is used for de-serializing the received binary GBP message to JSON object.
 * @param binaryMsg This parameter contains the binary message which should be transformed.
 * @return This method returns a promise.
 *         On Success it will contain the message as JSON object.
 *         On Failure it will contain the error message as string.
 */
async function transformGbptoJson(binaryMsg)
{
    return new Promise((resolve, reject) => {
        let logMsg = pb.SensorLogMessage.deserializeBinary(binaryMsg).toObject();

        if(logMsg == null)
        {
            reject("Malformed messaged received!");
        }

        // Change the eventType enumeration to string for improved readability in log files
        if(logMsg.eventType === pb.SensorLogMessage.EventType.INFORMATION)
            logMsg.eventType = "INFORMATION";
        else if (logMsg.eventType === pb.SensorLogMessage.EventType.ERROR)
            logMsg.eventType = "ERROR";
        else if (logMsg.eventType === pb.SensorLogMessage.EventType.WARNING)
            logMsg.eventType = "WARNING";

        // Convert the timestamp to JavaScript Date Object for easy comparision during sorting
        let timeStamp = new Date(0);
        timeStamp.setUTCSeconds(logMsg.timeStamp.seconds);
        timeStamp.setUTCMilliseconds(logMsg.timeStamp.nanos/1000000);

        logMsg.timeStamp = timeStamp;

        resolve(logMsg);
    });
}


/**
 * This method is used for sorting the log messages array and storing it to a file.
 * The method uses the quicksort library for sorting and file-manager module for storing.
 * @return {Promise<void>} Returns a void promise, as the application logic doesn't require
 *                         for this method to finish but can be completed asynchronously.
 */
async function sortAndStore()
{
    await quickSort.sort(logMessagesArray,timestampComparision);

    // Clear the queued write operation
    nextWrite = false;
    // Lock the file before initiating write operation.
    fileLock = true;

    fileManager.writeLogFile(logMessagesArray).then(() =>{
        // Release the file lock as write is completed
        fileLock = false;
        // Check if there in another write request queued, if yes
        // call sortAndStore method again.
        if(nextWrite === true)
            sortAndStore();
    }).catch((err) => {
        fileLock = false;
        console.error("Write Failed! "+err);
    });
}

/**
 * This method is used for handling the incoming messages received over the WebSocket connection from Ingest Service.
 * It calls the transformation method for converting the received message to JSON and calls the method 'sortAndStore'
 * for sorting and storing the received message.
 *
 * @param rcvdMsg This parameter contains the message received from ingest service.
 * @return This method returns a promise.
 *         On Success it will return success with no content.
 *         On Failure it will contain the error message as string.
 */
async function handleIncomingMsg(rcvdMsg){
    return new Promise((resolve, reject) => {
        transformGbptoJson(rcvdMsg.binaryData).then((logMsg) => {
            console.log("Received Message:");
            console.log(logMsg);

            // Check if the hour has changed, if yes then empty the sort array
            // and update the current hour variable.
            if(currentHour !== currentDate.getUTCHours()){
                logMessagesArray.length = 0;
                currentHour = currentDate.getUTCHours();
            }

            logMessagesArray.push(logMsg);

            // Check if File is not locked, call sort and store method else queue the
            // sort and write operation, this will happen after the previous write is complete.
            if(fileLock !== true)
                sortAndStore();
            else
                nextWrite = true;

            resolve();

        }).catch((err) => {
            reject(err);
        });
    });
}

/**
 * This method is used for creating the response message which is sent back to the ingest service.
 * @param respType This parameter contains the status which should be used for creating the response.
 *                 (SUCCESS || ERROR).
 * @param respPayload This parameter contains the error or success message as string which should be in the response
 *                    payload.
 * @return response The response object which should be sent back to ingest service.
 */
function createResponse(respType,respPayload) {
    let response = {};

    if(respType === "SUCCESS")
        response.status = "SUCCESS";
    else if(respType === "ERROR")
        response.status = "ERROR";

    response.payloadType = "UTF-8";
    response.payload = respPayload;

    return response;
}

/**
 * This is the main method for the log storage service, it acts as the entry point for the service,
 * It initialized the required parameters and start the websocket server, on reception of message
 * it forwards it to message handler and upon processing sends the response back to ingest service.
 */
async function main(){
    // Read the logs stored in the current hour's log file
    logMessagesArray = await fileManager.readLogFile();

    let server = http.createServer(function(request, response) {
    });
    server.listen(config.WEBSOCKET_LISTENING_PORT, function() {
        console.log("WebSocket server started! Listening on port: " + config.WEBSOCKET_LISTENING_PORT);
    });

    let wsServer = new webSocketServer({
        httpServer: server,
        autoAcceptConnections: false
    });

    wsServer.on('request', function(request) {

        if (!originIsAllowed(request.remoteAddress)) {
            request.reject();
            console.log((new Date()) + ' Connection from origin ' + request.remoteAddress + ' rejected.');
            return;
        }

        let connection = request.accept(request.origin);
        console.log((new Date()) + ' Connection accepted from ' + request.remoteAddress);

        connection.on('message', function(message) {
            if (message.type === 'binary') {
                console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');

                handleIncomingMsg(message).then((event) => {
                    let response = createResponse("SUCCESS",event);
                    connection.sendUTF(JSON.stringify(response));
                }).catch((err) => {
                    console.error("Failed to process received message: " + err);
                    let response = createResponse("ERROR",err);
                    connection.sendUTF(JSON.stringify(response));
                });
            }
            else{
                let errMsg = "Expected Binary Message, Got "+message.type;
                console.error(errMsg);
                let response = createResponse("ERROR",errMsg);
                connection.sendUTF(JSON.stringify(response));
            }
        });

        connection.on('close', function(reasonCode, description) {
            console.log((new Date()) + ' Client: ' + connection.remoteAddress + ' disconnected.');
        });
    });
}

main();