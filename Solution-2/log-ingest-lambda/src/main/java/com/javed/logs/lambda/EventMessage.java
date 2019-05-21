/**
 * This file contains the EventMessage class, used for representing the received log messages.
 *
 * @author Nadir Javed
 * @version 1.0.0
 */
package com.javed.logs.lambda;

/**
 * The EventMessage is the class which is used to represent the incoming event log messages from devices
 * as Java objects.
 */
public class EventMessage {
    private int deviceId;
    private long timeStamp;
    private EventTypes eventType;
    private String eventMessage;

    public EventMessage(int deviceId, long timeStamp, EventTypes eventType, String eventMessage) {
        this.deviceId = deviceId;
        this.timeStamp = timeStamp;
        this.eventType = eventType;
        this.eventMessage = eventMessage;
    }

    public int getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(int deviceId) {
        this.deviceId = deviceId;
    }

    public long getTimeStamp() {
        return timeStamp;
    }

    public void setTimeStamp(long timeStamp) {
        this.timeStamp = timeStamp;
    }

    public EventTypes getEventType() {
        return eventType;
    }

    public void setEventType(EventTypes eventType) {
        this.eventType = eventType;
    }

    public String getEventMessage() {
        return eventMessage;
    }

    public void setEventMessage(String eventMessage) {
        this.eventMessage = eventMessage;
    }
}
