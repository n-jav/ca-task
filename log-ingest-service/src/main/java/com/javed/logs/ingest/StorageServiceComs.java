/**
 * This file contains the StorageServiceComs class definition and implementation.
 * The class is used for communicating with the Log Storage Service over a websocket connection.
 *
 * @author Nadir Javed
 * @version 1.0.0
 */

package com.javed.logs.ingest;

import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;

import java.net.URI;

/**
 * StorageServiceComs is the class used for communicating with the Log Storage Service.
 * The class extends the WebSocketClient library and provides implementation for the mandatory interface methods.
 *
 */
public class StorageServiceComs extends WebSocketClient{

    public StorageServiceComs(URI serverUri) {
        super(serverUri);
    }

    @Override
    public void onOpen( ServerHandshake data ) {
        System.out.println( "opened connection" );
    }

    @Override
    public void onMessage( String message ) {
        System.out.println( "received: " + message );
    }

    @Override
    public void onClose( int code, String reason, boolean remote ) {
        System.out.println( "Connection closed! Code: " + code + " Reason: " + reason );
    }

    @Override
    public void onError( Exception ex ) {
        ex.printStackTrace();
    }

    /**
     * This method is used for transmitting the log messages in binary format over
     * the websocket connection.
     *
     * @param logMsg This parameter contains the binary message which should be transmitted.
     */
    protected void sendLogMsg(byte[] logMsg) {
        if(this.isOpen())
        {
            send(logMsg);
            System.out.println("Sent Binary Data");
        }
        else
        {
            System.out.println("Message could not be sent!");
            System.out.println("Connection not open!");
        }
    }
}
