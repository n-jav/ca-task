/**
 * This file contains the RestResponse class, used for API responses.
 *
 * @author Nadir Javed
 * @version 1.0.0
 */

package com.javed.logs.ingest;

/**
 * The RestResponse is the class which is used for generating the response message objects
 * sent by the API implemented in LogsRestService .
 */

public class RestResponse {
    private ResponseStatus status;
    private String message;

    public RestResponse(ResponseStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    public ResponseStatus getStatus() {
        return status;
    }

    public void setStatus(ResponseStatus status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
