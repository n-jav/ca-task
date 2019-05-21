/**
 * This file contains the RestResponse class, used for send response back to API requests.
 *
 * @author Nadir Javed
 * @version 1.0
 */
package com.javed.logs.lambda;

import org.json.simple.JSONObject;

/**
 * The RestResponse is the class which is used for generating the response message objects
 * sent by the API. It follows the response format expected by the API Gateway service for
 * Lambda Integrations.
 */
public class RestResponse {
    private int statusCode;
    private JSONObject responseJSON;
    private JSONObject responseBody;

    public RestResponse()
    {
        this.statusCode = 0;
        this.responseJSON = new JSONObject();
        this.responseBody = new JSONObject();

        this.responseBody.put("status",null);
        this.responseBody.put("message","");

        this.responseJSON.put("statusCode",this.statusCode);
        // Required due to Lambda proxy integration with API Gateway
        this.responseJSON.put("isBase64Encoded", false);
        this.responseJSON.put("body",this.responseBody.toString());

    }

    public RestResponse(ResponseStatus status, String message, int statusCode) {

        this.statusCode = statusCode;
        this.responseJSON = new JSONObject();
        this.responseBody = new JSONObject();

        this.responseBody.put("status",status);
        this.responseBody.put("message",message);

        this.responseJSON.put("statusCode",statusCode);
        this.responseJSON.put("isBase64Encoded", false);
        this.responseJSON.put("body",responseBody.toString());
    }


    public int getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(int statusCode) {
        this.statusCode = statusCode;
        this.responseJSON.put("statusCode",statusCode);
    }

    public JSONObject getResponseJSON() {
        return responseJSON;
    }

    public JSONObject getResponseBody() {
        return responseBody;
    }

    public void setResponseBody(ResponseStatus status, String message) {
        this.responseBody.put("status",status);
        this.responseBody.put("message",message);

        this.responseJSON.put("body",this.responseBody.toString());
    }
}
