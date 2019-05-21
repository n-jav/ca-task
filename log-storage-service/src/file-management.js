/**
 * This file contains the file-management module for node.js. It handles reading and writing the log files,
 * in addition it rotates the log file every hour to which the information is written or read from.
 *
 * @author Nadir Javed
 * @version 1.0.0
 */

"use strict";

//Load Configurations
const config = require("./config.json");
var fileSystem = require("fs");

/**
 * This method creates the filename to be used for storing logs.
 * It uses the JavaScript Date API to generate a name based on current date and hour in UTC timezone.
 * @return This method returns the generated file name as string.
 */
async function getFileHandle()
{
    //Checking if directory path loaded from configuration file exists
    if(!fileSystem.existsSync(config.LOG_FILES_DIRECTORY))
    {
        fileSystem.mkdirSync(config.LOG_FILES_DIRECTORY);
    }

    let curDate = new Date();
    let fileName = "logs-"+curDate.getUTCHours()+"-"+curDate.getUTCDate()
        +"-"+curDate.getUTCMonth()+"-"+curDate.getUTCFullYear();
    let filePath = config.LOG_FILES_DIRECTORY+fileName+".json";

    //Check if file exists, if not create an empty logs file.
    if(!fileSystem.existsSync(filePath))
    {
        fileSystem.closeSync(fileSystem.openSync(filePath, 'w'));
    }

    return filePath;
}

/**
 * This method is used for writing the logs to a file.
 * @param logArray An array containing logs to be written in JSON format
 * @return This method returns a promise.
 *         On Success it will resolve the promise with no content
 *         On Failure it will reject the promise with error message as string.
 */
exports.writeLogFile = async function(logArray)
{
    let fileHandle = await getFileHandle();
    let outputData = JSON.stringify(logArray, null, 2);

    return new Promise((resolve, reject) => {
        fileSystem.writeFile(fileHandle, outputData, 'utf8', (err) => {
            if (err) {
                console.error("Error occurred when writing logs to file!");
                console.error(err);
                reject(err);
            }
            console.log("Logs written successfully to File: " + fileHandle);
            resolve();
        });
    });
}

/**
 * This method is used for reading the current hour's log file from Filesystem.
 * @return This method returns a promise.
 *         On Success it will contain an array with current hour's logs as JSON objects.
 *         On Failure it will contain the error message as string.
 */
exports.readLogFile = async function () {
    let fileHandle = await getFileHandle();

    return new Promise((resolve, reject) => {
        fileSystem.readFile(fileHandle,'utf-8', (err, data) => {
            if (err) {
                console.error("Error occurred when reading the logs file: "+fileHandle);
                reject(err);
            }
            let logArray = [];
            if(data !== ""){
                logArray = JSON.parse(data);
            }

            // Convert timestamp in each record into JavaScript Date object,
            // so that it can be used for sorting.
            for(let i=0; i < logArray.length; i++)
            {
                let logObj = logArray[i];
                logObj.timeStamp = new Date(logObj.timeStamp);
                logArray[i] = logObj;
            }

            resolve(logArray);
        });
    });
}


