/**
 * This file contains the LogRestService class, which is the main class for the ingest service.
 *
 * @author Nadir Javed
 * @version 1.0.0
 */
package com.javed.logs.ingest;

import com.google.gson.Gson;
import com.google.protobuf.Timestamp;

import java.net.URI;

import static spark.Spark.post;

/**
 * The LogsRestService is the class which provides the main method for the logs ingest application.
 * In the main method we define the routes needed for Rest Service. We are using Spark Framework
 * for implementing the REST interface.
 *
 * By Default the service will start at port '4567', accessible at "localhost:4567"
 *
 * API Resources:
 * /logs: only POST method is supported on the resource.
 *        Request message should contain the "ContentType" header with only accepted value as "application/json".
 *        Response Body :
 *        {
 *            STATUS: SUCCESS | ERROR,
 *            MESSAGE: Contains details about the success or error message.
 *        }
 */
public class LogsRestService {

    // Edit this string to change the address of Storage Service
    private static String logStorageServiceAddress = "ws://localhost:7890";

    /**
     * This method is used for converting the enumeration defined in EventTypes.java into
     * enumerations for event types generated as part of SensorLogProtos by Google Buffer Protocol
     * compiler.
     *
     * @param eventType Enumeration which should be converted
     * @return EventType enumeration generated as part of the SensorLogProtos class.
     */
    private static SensorLogProtos.SensorLogMessage.EventType convertEventType(EventTypes eventType){

        SensorLogProtos.SensorLogMessage.EventType protoEventType = null;

        if(eventType == EventTypes.ERROR)
            protoEventType = SensorLogProtos.SensorLogMessage.EventType.ERROR;
        else if (eventType == EventTypes.INFORMATION)
            protoEventType = SensorLogProtos.SensorLogMessage.EventType.INFORMATION;
        else
            protoEventType = SensorLogProtos.SensorLogMessage.EventType.WARNING;

        return protoEventType;
    }

    /**
     * This method is used for creating the message in Google Buffer Protocol format, it
     * uses the builder provided in the generated SensorLogProtos class.
     *
     * @param eventMsg EventMessage containing the info which should be used for creating the Proto.
     * @return Returns the Proto message in GBP containing the information in message provided as parameter.
     */
    private static SensorLogProtos.SensorLogMessage createProtoMessage(EventMessage eventMsg){

        return SensorLogProtos.SensorLogMessage.newBuilder()
                    .setSensorId(eventMsg.getDeviceId())
                    .setTimeStamp(Timestamp.newBuilder().setSeconds(eventMsg.getTimeStamp() / 1000)
                            .setNanos((int) ((eventMsg.getTimeStamp() % 1000) * 1000000)).build())
                    .setEventType(convertEventType(eventMsg.getEventType()))
                    .setEventMessage(eventMsg.getEventMessage())
                    .build();
    }

    /**
     * The main method for the Log Ingest Service, this method defines the required API route and
     * sends the received messages over HTTP to storage service over a websocket connection using
     * the StorageServiceComs class.
     */
    public static void main(String[] args) {

        StorageServiceComs serviceComs = new StorageServiceComs(URI.create(logStorageServiceAddress));
        serviceComs.connect();

        post("/logs","application/json", (req,res)->{
            System.out.println("POST request received at '/logs' resource!");
            System.out.println(req.body());

            //Convert the received JSON message to Java object
            EventMessage eventMsg = new Gson().fromJson(req.body().toString(),EventMessage.class);
            //Convert the Java Object to Google Protocol Buffers Message
            SensorLogProtos.SensorLogMessage sensorLogMessage = createProtoMessage(eventMsg);

            //Serialize the GPB message to binary data
            byte[] sensorLogMessageBinary = sensorLogMessage.toByteArray();

            //Send the binary data to storage service for persistence.
            serviceComs.sendLogMsg(sensorLogMessageBinary);

            //Set the response type to JSON
            res.type("application/json");
            //Create the API response in the expected format.
            RestResponse respMsg = new RestResponse(ResponseStatus.SUCCESS,"Message from device:"
                    +eventMsg.getDeviceId()+" successfully processed");
            return new Gson().toJson(respMsg);
        });
    }
}