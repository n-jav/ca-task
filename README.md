# CA - Task

There were two solutions implemented for the problem described in the task. Solution 1 follows the requirements set forth in the task and is aimed at running locally or on self-provisioned servers. Solution 2 provides the cloud-based implementation for the task based on serverless technologies and managed services provided by AWS. You can find further detatils about the solutions in the descriptions provided as a PDF document.

## Solution 1

Solution is composed of 3 applications
- Multi-device Simulator (Node.js)
- Log Ingest Service (Java)
- Log Storage Service (Node.js)

### Log Storage Service

This is a node.js based application which provides the service for storing logs to the local filesystem. It should be started first as the Log Ingest Service will attempt to connect to this service on start.

#### Prerequisites

You need to have the Node.js environment setup.

- You can install the Node.js for your operating system by downloading it at: https://nodejs.org/en/download/
- Installation steps can also be found on the same page.

#### Configurations

This application uses a configuration file for reading the required parameters, you can change the values before starting the application. The file is called 'config.json' and it is located under the 'logs-storage-service/src' directory. The supported parameters are provided below:

```
- WEBSOCKET_LISTENING_PORT - default value 7890 - The port on which the Websocket server listens for incoming connections.
- LOG_FILES_DIRECTORY - default value "./Logs/" - The directory path where the logs should be stored.
- ALLOWED_CLIENT_ADDRESS - default value "::ffff:127.0.0.1" - Host address from which the server accepts connections.
```

#### Starting the application

The application depends on a few 3rd party node.js modules which are provided in the repository for convenience. If you would like to fetch the modules yourself, you will need to have 'npm' installed on your machine.

If using npm, navigate with your console/terminal window to the directory named 'log-storage-service' containing the package.json file. Then issue the following command

```
- npm install
- npm start
```
otherwise just navigate to directory 'log-storage-service/src' and give the following command

```
node log-storage-service.js
```

#### Application Dependencies

* [websocket](https://www.npmjs.com/package/websocket) - WebSocket Client & Server Implementation for Node
* [google-protobuf](https://www.npmjs.com/package/google-protobuf) - Protocol Buffers - Google's data interchange format
* [optimized-quicksort](https://www.npmjs.com/package/optimized-quicksort) - Optimized version of quicksort.


### Log Ingest Service

This is a Maven based Java application which should be started once 

#### Prerequisites

The application depends on Java SDK 12


```
- You can download the SDK at: https://www.oracle.com/technetwork/java/javase/downloads/jdk12-downloads-5295953.html
- Installation instructions can also be found at the same source.
```

 