/**
 * This file contains the APIHandler class which is the starting point for the Lambda Function.
 *
 * @author Nadir Javed
 * @version 1.0.0
 */
package com.javed.logs.lambda;

import com.amazonaws.services.lambda.runtime.*;
import com.google.gson.Gson;
import com.google.protobuf.Timestamp;
import org.json.simple.parser.JSONParser;
import org.json.simple.JSONObject;
import org.json.simple.parser.ParseException;

import com.amazonaws.services.sqs.AmazonSQS;
import com.amazonaws.services.sqs.AmazonSQSClientBuilder;
import com.amazonaws.services.sqs.model.SendMessageRequest;
import com.amazonaws.services.sqs.model.MessageAttributeValue;

import java.io.*;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import static java.lang.System.getenv;

/**
 * This class implments the RequestStreamHandler interface used by AWS Lambda Services to invoke the function.
 * It overrides the handleRequest method which is used as the entry point for this Lambda function.
 * In addition the class also includes methods for transforming the received JSON messages to Google Buffer Protocol
 * and sending mechanism for publishing transformed messages to AWS SQS.
 */
public class APIHandler implements RequestStreamHandler {

    /**
     * This method converts the Java enumerated event type into enumerations defined by the Google Buffer Proto.
     * @param eventType Contains the event type enumeration to be converted to GBP enumeration
     * @return Returns the converted event type in GBP enumerated format.
     */
    private SensorLogProtos.SensorLogMessage.EventType convertEventType(EventTypes eventType){

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
     *  This methods creates a Google Buffer Protocol message from the provided Java EventMessage
     * @param eventMsg Message object which should be used to create the new GBP message.
     * @return Returns the newly created GBP message.
     */

    private SensorLogProtos.SensorLogMessage createProtoMessage(EventMessage eventMsg){

        return SensorLogProtos.SensorLogMessage.newBuilder()
                .setSensorId(eventMsg.getDeviceId())
                .setTimeStamp(Timestamp.newBuilder().setSeconds(eventMsg.getTimeStamp() / 1000)
                        .setNanos((int) ((eventMsg.getTimeStamp() % 1000) * 1000000)).build())
                .setEventType(convertEventType(eventMsg.getEventType()))
                .setEventMessage(eventMsg.getEventMessage())
                .build();
    }

    /**
     * This method is used for sending the binary GBP message to SQS queue for storage.
     * @param serializedGBPMessage This parameter contains the GBP binary message.
     * @param queueName This parameter contains the name of queue where the message should be published.
     */
    private void sendEventToSQS(byte[] serializedGBPMessage, String queueName)
    {
        // Create the message attribute which can be used for sending binary data to SQS
        final Map<String, MessageAttributeValue> messageAttributes = new HashMap<>();
        messageAttributes.put("GBP-Binary", new MessageAttributeValue()
                .withDataType("Binary")
                .withBinaryValue(ByteBuffer.wrap(serializedGBPMessage)));

        // SQS Client
        AmazonSQS sqs = AmazonSQSClientBuilder.defaultClient();

        // Get the queue url for the provided queue name
        String queueUrl = sqs.getQueueUrl(queueName).getQueueUrl();

        SendMessageRequest sendMessageRequest = new SendMessageRequest();
        sendMessageRequest.withMessageBody("Log Message");
        sendMessageRequest.withQueueUrl(queueUrl);
        sendMessageRequest.withMessageAttributes(messageAttributes);
        sqs.sendMessage(sendMessageRequest);
    }

    /**
     * This method acts as the entry point for this Lambda function and it is invoked by AWS API Gateway upon a request
     * to POST method on '/logs' API resource.
     * @param inputStream contains the invoking event including the request body from API.
     * @param outputStream used for sending the response back to the API user.
     * @param context provides the conext for Lambda function e.g. invoking service, remaining runtime etc.
     * @throws IOException In case of not being able to read from inputStream or write to outputStream.
     */
    @Override
    public void handleRequest(InputStream inputStream, OutputStream outputStream, Context context)
            throws IOException {

        JSONParser jsonParser = new JSONParser();
        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
        RestResponse response;

        // Read the Lambda environment variable containing
        // SQS queue name used for communicating with storage service.
        final String queueName = System.getenv("QUEUE_NAME");


        try {
            // Convert the incoming request to JSON
            JSONObject event = (JSONObject) jsonParser.parse(reader);

            // Log the received request body to AWS CloudWatch Service
            context.getLogger().log(event.get("body").toString());

            if (event.get("body") != null) {

                //Convert the received event message to Java object
                EventMessage eventMessage = new Gson().fromJson(event.get("body").toString(),EventMessage.class);

                //Convert the Java Object to Google Protocol Buffers Message
                SensorLogProtos.SensorLogMessage sensorLogMessage = createProtoMessage(eventMessage);

                //Serialize the GPB message to binary data
                byte[] sensorLogMessageBinary = sensorLogMessage.toByteArray();

                // Send the serialized GBP message via SQS queue to storage service persistence
                sendEventToSQS( sensorLogMessageBinary, queueName);

                response = new RestResponse(ResponseStatus.SUCCESS, "Message accepted and processed for storage", 200);

            }
            else {
                response = new RestResponse(ResponseStatus.ERROR,"There was no body provided with the request",400);
            }

        } catch (ParseException pex) {
            response = new RestResponse(ResponseStatus.ERROR,"Request message could not be parsed",400);
        }

        context.getLogger().log(response.getResponseJSON().toString());

        OutputStreamWriter writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);
        writer.write(response.getResponseJSON().toString());
        writer.close();
    }

}
