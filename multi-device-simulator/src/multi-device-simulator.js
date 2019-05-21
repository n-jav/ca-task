/**
 * This file contains the main method for Multi Device Simulator application.
 * It initiates and schedules a set number of devices to generate and send event messages to ingest service.
 *
 * @author Nadir Javed
 * @version 1.0.0
 */

"use strict";

// Setting the process name
process.title = 'multi-device-simulator';

var Device = require("./device.js");

// Load configuration file
const config = require("./config.json");

// Load eventTypes and sample messages
const eventTypes = require("./events/eventTypes.json");
const warningMsgs = require("./events/warnings.json");
const informationMsgs = require("./events/information.json");
const errorMsgs = require("./events/errors.json");

// Create the address for log ingestion service based on mode configuration from config.json,
// in case of incorrect mode, exit the application.
var logServiceAddress = null;
if(config.MODE === "AWS")
    logServiceAddress = config.AWS_INGEST_SERVICE;
else if (config.MODE === "LOCAL")
    logServiceAddress = "http://"+config.INGEST_SERVICE_HOSTNAME+":"+config.INGEST_SERVICE_PORT+"/logs";
else{
    console.error("Incorrect Mode! Please change value of MODE in config.json to LOCAL or AWS");
    process.exit();
}

/**
 * Collection of all sample event message for random selection based on eventType
 * 0 = Error Messages
 * 1 = Information Messages
 * 2 = Warning Messages
 */
var eventMsgs = [];
eventMsgs.push(errorMsgs);
eventMsgs.push(informationMsgs);
eventMsgs.push(warningMsgs);

/**
 * We use this array to store the interval objects returned when scheduling devices to
 * generate random events at every configured interval.
 */
var scheduleObjects = [];

/**
 * This method is used for generating a random event message based on JavaScript random method.
 * It uses the random value generated to pick an event type from the supported list and then a
 * corresponding event message.
 * @param sensorId Device id which should be placed in the generated event.
 * @return {Promise<*>} It returns a Promise object, on Success it contains the generated message
 */
async function generateRandomEvent(sensorId){
    return new Promise((resolve, reject) => {
        let eventMsg = {};
        eventMsg.deviceId = sensorId;
        eventMsg.timeStamp = Date.now();

        //generate a random number between 0 and 2 to select a random event type from the const list
        let rand1 = Math.floor(Math.random() * Math.floor(3));
        eventMsg.eventType = eventTypes[rand1.toString()];

        //generate another random number between 0 and 2 to select a random event message from the list
        let rand2 = Math.floor(Math.random() * Math.floor(3));
        eventMsg.eventMessage = eventMsgs[rand1][rand2.toString()];

        resolve(eventMsg);
    });
}

/**
 * This method makes a call to the random event generator, upon receiving the generated
 * event, it calls the transmitEvent functionality of the device with the received event.
 *
 * @param deviceObj Device which should be used to transmit the event.
 */
function sendEvent(deviceObj) {
        generateRandomEvent(deviceObj.deviceId).then((event) => {
            deviceObj.transmitEvent(event,logServiceAddress);
        });
}

/**
 * This method sends the initial event from the device passed as parameter and the sets
 * a regular interval at which the device will transmit an event. It uses the built-in JavaScript
 * setInterval functionality for scheduling.
 *
 * @param deviceObj Device which should be scheduled to transmit.
 */
function scheduleDeviceEvents(deviceObj){
    console.log("Scheduling Device:"+deviceObj.deviceId);
    sendEvent(deviceObj);
    scheduleObjects.push(setInterval(sendEvent,config.EVENT_TRANSMISSION_INTERVAL_SECONDS*1000,deviceObj));
}

/**
 * This method is the main entry point for the application.
 * It initiates the 'configured' number of device objects, and sets a
 * random timeout for each device before they will start to transmit the events to ingest service.
 */
function initiateDevices(){
    for(let i = 1; i<= config.NO_OF_SIMULATED_DEVICES; i++)
    {
        /*
         * Generating a random interval between 0 and maximum no of devices simulated.
         * This is to ensure that not all sensors start sending the data at the same time, emulating a behavior
         * closer to reality.
         */
        let randInterval = Math.floor(Math.random() * Math.floor(config.NO_OF_SIMULATED_DEVICES));
        console.log("Device:"+i+" will start transmitting in "+randInterval+"s");
        setTimeout(scheduleDeviceEvents,randInterval*1000,new Device(i));
    }
}

initiateDevices();
