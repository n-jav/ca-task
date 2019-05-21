# CA - Task

There were two solutions implemented for the problem described in the task. Solution 1 follows the requirements set forth in the task and is aimed at running locally or on self-provisioned servers. Solution 2 provides the cloud-based implementation for the task based on serverless technologies and managed services provided by AWS. You can find further detatils about the solutions in the descriptions provided as a PDF document.

## Solution 1

Solution is composed of 3 applications
- Multi-device Simulator (Node.js)
- Log Ingest Service (Java)
- Log Storage Service (Node.js)

#### Starting the solution

The applications in the solution should be started in the order provided below:
```
1. Log Storage Service
2. Log Ingest Service
3. Multi-device Simulator
```
You will find details on how to start the applications in the "Starting the application" section for each application.

## Log Storage Service

This is a node.js based application which provides the service for storing logs to the local filesystem. It should be started first as the Log Ingest Service will attempt to connect to this service on start.

#### Prerequisites

You need to have the Node.js environment setup.

- You can install the Node.js for your operating system by downloading it at: https://nodejs.org/en/download/
- Installation steps can also be found on the same page.

#### Configurations

This application uses a configuration file for reading the required parameters, you can change the values before starting the application. The file is called 'config.json' and it is located under the 'logs-storage-service/src' directory. The supported parameters are provided below:

```JSON
// The port on which the Websocket server listens for incoming connections.
- WEBSOCKET_LISTENING_PORT : default value 7890

// The directory path where the logs should be stored.
- LOG_FILES_DIRECTORY : default value "./Logs/" 

// Host address from which the server accepts connections.
- ALLOWED_CLIENT_ADDRESS : default value "::ffff:127.0.0.1" - 
```

#### Starting the application

The application depends on a few 3rd party node.js modules which are provided in the repository for convenience. If you would like to fetch the modules yourself, you will need to have 'npm' installed on your machine.

If using npm, navigate with your console/terminal window to the directory named 'log-storage-service' containing the package.json file. Then issue the following commands

```Bash
npm install
npm start
```
otherwise just navigate to directory 'log-storage-service/src' and give the following command

```bash
node log-storage-service.js
```

#### Application Dependencies

* [websocket](https://www.npmjs.com/package/websocket) - WebSocket Client & Server Implementation for Node
* [google-protobuf](https://www.npmjs.com/package/google-protobuf) - Protocol Buffers - Google's data interchange format
* [optimized-quicksort](https://www.npmjs.com/package/optimized-quicksort) - Optimized version of quicksort.


## Log Ingest Service

This is a Maven based Java application which provides the service of ingesting logs from the devices over a REST API and forwards the received messaged to storage service.

It should be started once the Log Storage Service is running, as it attempts to connect with the service on start up.

#### Prerequisites

The application depends on Java version 8 or higher. If you alread have the Java SDK or JRE installed higher than version 8, you can skip the step below.

- For the latest SDK 12, you can download it at: https://www.oracle.com/technetwork/java/javase/downloads/jdk12-downloads-5295953.html
- Installation instructions can also be found at the same source.
- Alternatively you can install the version 8 SDK from https://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html or if you are on a non dev machince, just the JRE from https://www.oracle.com/technetwork/java/javase/downloads/jre8-downloads-2133155.html

#### Configurations

There are no special configurations required by the application other than the port on which it starts the webserver to listening for incoming HTTP requests.

By default the application uses port: 4567.

If you want to change the default address or port of storage service, you can do so by modifying the following line in class 'LogsRestService'.
Any change would require you to rebuild the application.

```Java
    // Edit this string to change the address of Storage Service
    private static String logStorageServiceAddress = "ws://localhost:7890";
```

#### Starting the application

For your convenience, a pre-packaged single JAR package is provided for you along with the source code.

If you want to use the pre-packaged JAR to run the application, simply navigate to folder 'log-ingest-service/' and give the following command

```bash
java -jar logs-ingest-1.0.jar
```
If you would like to compile the source code yourself, you would need to have the Apache Maven installed on your machine.
You can download it from : https://maven.apache.org/download.cgi
Install guide is available at : https://maven.apache.org/install.html

Once you have the Maven installed, give the following command at folder 'log-ingest-service/' containing the pom.xml file

```bash
mvn clean package shade:shade
```
After the build process is complete, navigate to folder 'log-ingest-service/target' and run the application by giving the following command
```bash
java -jar logs-ingest-1.0.jar
```
#### Application Dependencies

* [Spark](http://sparkjava.com/) - A micro framework for creating web applications in Kotlin and Java 8 with minimal effort
* [Gson](https://github.com/google/gson) - A Java serialization/deserialization library to convert Java Objects into JSON and back
* [Protobuf-Java](https://github.com/protocolbuffers/protobuf/tree/master/java) - Protocol Buffers - Google's data interchange format
* [Java-WebSocket](https://github.com/TooTallNate/Java-WebSocket) - A barebones WebSocket client and server implementation written in 100% Java.

## Multi Device Simulator

This is a node.js based application which emulates a number of resource-constrained cellular enabled devices which transmit event messages to ingestion service at regular intervals.

This application should be started once the log ingest and log storage services are running.

#### Prerequisites

The application depends on Node.js and would need the node environment to be setup in order to execute.
If you already installed Node in the earlier steps then no extra step is required. If not, please refer to the prerequisites section of Log Storage Service to setup the environment.

#### Configurations

This application uses a configuration file for reading the required parameters, you can change the values before starting the application. The file is called 'config.json' and it is located under the 'multi-device-simulator/src' directory. The supported parameters are provided below:

```JSON
{
  "MODE": "LOCAL",
  "INGEST_SERVICE_HOSTNAME": "localhost",
  "INGEST_SERVICE_PORT": 4567,
  "AWS_INGEST_SERVICE": "https://m6qo6re704.execute-api.eu-central-1.amazonaws.com/v1/logs",
  "EVENT_TRANSMISSION_INTERVAL_SECONDS": 60,
  "NO_OF_SIMULATED_DEVICES": 20
}
```

- MODE : Possible values "LOCAL" or "AWS", if using the simulator for Solution 1 please use "LOCAL".
- INGEST_SERVICE_HOSTNAME : Address where the Logs Ingest Service is running, if it's on the same machine as simulator then default value will suffice.
- INGEST_SERVICE_PORT : Port on which the Logs Ingest Service is listening for requests, if you didn't change this in ingest service then default value will be fine.
- AWS_INGEST_SERVICE : Address of the ingest service API when running in the cloud, you can leave it empty for Solution 1.
- EVENT_TRANSMISSION_INTERVAL_SECONDS : Transmission interval used by the devices for sending events.
- NO_OF_SIMULATED_DEVICES : Number of devices which should be emulated in the application.

#### Starting the application

The application depends on a 3rd party node.js module which is provided in the repository for convenience. If you would like to fetch the module yourself, you will need to have 'npm' installed on your machine.

If using npm, navigate with your console/terminal window to the directory named 'multi-device-simulator' containing the package.json file. Then issue the following commands

```Bash
npm install
npm start
```
otherwise just navigate to directory 'multi-device-simulator/src' and give the following command

```Bash
node multi-device-simulator.js
```
#### Application Dependencies

* [axios](https://www.npmjs.com/package/axios) - Promise based HTTP client for the browser and node.js


## Solution 2

Solution 2 provides the implementation of the task based on cloud services in AWS environment. The details about the solution can be found in accompanying "Solution Description and Architecture" PDF document.

If you would just like to utilize the already deployed solution without deploying your own solution, you can just run the provided 'multi-device-simulator-cloud' application. This is exaclty the same source code used in solution 1, the only difference is in the configuration file 'config.json'.

The same configuration parameters apply as described earlier in the document, only the MODE attribute is changed to "AWS". Once the device simulator application is running, you can navigate to the Kibana access address provided in the PDF document to see the logs being generated by the device simulator being stored in Elasticsearch.

### Deploying the solution to your own account



 