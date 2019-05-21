/**
 * This file contains the main handler method which is used by AWS Lambda service to
 * invoke the function. On receiving the message, the function de-serialized the message
 * to JSON and stores in Elasticsearch under 'logs' index.
 *
 * @author Nadir Javed
 * @version 1.0.0
 */

"use strict";

// Google Protocol Buffer Message Description
var pb = require('./sensor_log_message_pb.js');

var esManager = require("./elasticsearch-manager.js");

// Load Configurations
const config = require("./config.json");

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

        //Change the eventType enumeration to string for improved readability in log files
        if(logMsg.eventType === pb.SensorLogMessage.EventType.INFORMATION)
            logMsg.eventType = "INFORMATION";
        else if (logMsg.eventType === pb.SensorLogMessage.EventType.ERROR)
            logMsg.eventType = "ERROR";
        else if (logMsg.eventType === pb.SensorLogMessage.EventType.WARNING)
            logMsg.eventType = "WARNING";

        //Convert the timestamp to human readable timestamp
        let timeStamp = new Date(0);
        timeStamp.setUTCSeconds(logMsg.timeStamp.seconds);
        timeStamp.setUTCMilliseconds(logMsg.timeStamp.nanos/1000000);

        logMsg.timeStamp = timeStamp;

        resolve(logMsg);

    });
}

/**
 * This method is used for handling the incoming messages received via AWS SQS from Ingest Service.
 * It calls the transformation method for converting the received message to JSON and stores the message
 * to Elasticsearch using elasticsearch manager module.
 *
 * @param rcvdMsg This parameter contains the message received from ingest service.
 * @return This method returns a promise.
 *         On Success it will return success with no content.
 *         On Failure it will contain the error message as string.
 */
async function handleIncomingMsg(rcvdMsg){
    return new Promise((resolve, reject) => {
        let binaryData = rcvdMsg.messageAttributes['GBP-Binary'].binaryValue;
        transformGbptoJson(binaryData).then((logMsg) => {
            console.log(logMsg);
            esManager.storeLogs(config.ELASTICSEARCH_INDEX,logMsg).then(() => {
                resolve();
            }).catch((err) => {
                reject(err);
            });
        }).catch((err) => {
            reject(err);
        });
    });
}


/**
 * This method acts as the entry point for Lambda function which
 * is invoked by the AWS service on invocation.
 * @param event This is the event containing any input provided to Lambda function by invoking service.
 * @param context This provides the contextual information to Lambda function e.g. invoking service, remaining time etc.
 * @param callback This is the callback function which should be used to provide results at end of execution.
 */
exports.handler = function(event, context,callback) {

    console.log(event);

    let promiseArray = [];

    for(let i=0;i<event.Records.length;i++)
    {
        promiseArray.push(handleIncomingMsg(event.Records[i]));
    }

    Promise.all(promiseArray).then(() => {
        callback(null,"Done");
    }).catch((err) => {
        console.log(err);
        callback(null,"Failed");
    });
}
