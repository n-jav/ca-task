/**
 * This file contains the Device module, which emulates a simple cellular enabled device
 *
 * @author Nadir Javed
 * @version 1.0.0
 */

"use strict";

// Promise based HTTP client, used instead of built-in node module due to avoid verbose nature of http module
// and improve code readability.
const axios = require('axios');


/**
 * This class is used to simulate a very simple constrained device which can use cellular radio
 * for communication.
 */
class Device {

    constructor(id){
        this.deviceId = id;
        this.cellularRadio = false;
    }

    /**
     * This method activates the cellular radio, to simulate the real life behavior
     * where cellular radio is not always active but it is activated just before
     * transmission or reception.
     */
    activateRadio(){
        this.cellularRadio = true;
        console.log("Device ID: "+this.deviceId+", Radio activated.");
    }

    /**
     * This method deactivates the cellular radio. once the transmission is finished,
     * the radio can be turned off to conserve power. In reality, this would not be
     * completely off but go into a low power mode.
     */
    deactivateRadio(){
        this.cellularRadio = false;
        console.log("Device ID:"+this.deviceId+", Radio deactivated.");
    }

    //Returns the simulated cellular radio status
    get radioStatus(){
        return this.cellularRadio;
    }

    /**
     * This method is used for transmitting messages over HTTP to the provided address.
     * For simulation purpose, the device radio (represented by a boolean value) is activated
     * before transmission and then deactivated once the message is transmitted.
     *
     * @param event Event which should be transmitted.
     * @param address Address to which the HTTP POST request should be made.
     */
    transmitEvent(event,address){
        this.activateRadio();
        axios.post(address,event).then((res) => {

            console.log("Device ID:"+this.deviceId+", Transmission Successful!");
            this.deactivateRadio();

        }).catch((error) => {
                console.error(error);
            });
    }
}

module.exports = Device;