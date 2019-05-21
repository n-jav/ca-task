/**
 * This file provides a simple manager module, which can be used by the lambda function to
 * manage Elasticsearch indices and store messages to Elasticsearch domain.
 *
 * @author Nadir Javed
 * @version 1.0.0
 */

"use strict";

var es = require('elasticsearch');

//Load Configurations
const config = require("./config.json");

// Create the elasticsearch client
const esClient = new es.Client({
    host: config.ELASTICSEARCH_DOMAIN
});

/**
 * This method is used for checking if an index exists in the configured Elasticsearch domain.
 *
 * @param indexName This parameter contains the index name to be checked.
 * @return This method returns a promise.
 *         On Success if index was found, it returns Promise with Boolean: true
 *         On Success if index not found, it returns Promise with Boolean: false
 *         On Failure it will contain the error message as string.
 */
exports.checkIndexExists = async function(indexName){
    return new Promise((resolve, reject) => {
        esClient.indices.exists({index:indexName}, (err,result) => {
            if(!err) {
                if(result === false){
                    console.log("Index doesn't exist");
                    resolve(false);
                }
                else{
                    console.log("Index exists");
                    resolve(true);
                }
            }
            else {
                console.log("Failed to communicate with ES Domain!");
                reject(err);
            }

        });
    });
}

/**
 * This method is used for creating new indexes in the configured Elasticsearch domain.
 *
 * @param indexName This parameter contains the index name to be created.
 * @return This method returns a promise.
 *         On Success if index was created, it returns a Promise with no content.
 *         On Failure it will reject the promise and contain the error message as string.
 */
exports.createIndex =  async function(indexName){
    return new Promise((resolve, reject) => {
        esClient.indices.create({index: indexName}, (err,result) => {
            if(err) {
                console.log("Failed to create the index");
                reject(err);
            }
            else {
                console.log("Index created: " + result);
                resolve();
            }
        });
    });
}

/**
 * This method is used for storing log messaged in JSON format to provided index name in
 * configured Elasticsearch domain.
 *
 * @param indexName This parameter contains the index name where the message should be stored.
 * @param logMsg This parameter contains the log message which should be stored.
 * @return This method returns a promise.
 *         On Success if message was stored, it returns a Promise with no content.
 *         On Failure it will reject the promise and contain the error message as string.
 */
exports.storeLogs = async function(indexName,logMsg){
    return new Promise((resolve, reject) => {
        esClient.index({
            index: indexName,
            type: "Logs",
            body: logMsg
        }, (err,res) => {
            if(err){
                console.log("Failed to store log message to ES!");
                reject(err);
            }
            else{
                console.log("Log message stored" + res.toString());
                resolve();
            }
        });
    });
}

