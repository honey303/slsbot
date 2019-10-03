'use strict';

const axios = require('axios');
const AWS = require('aws-sdk');

const translate = new AWS.Translate();
const db = new AWS.DynamoDB();

// check if the text is already present
const exists = (userdata, translateTo) => {
  return new Promise((resolve, reject) => {
      let params = {
          TableName : process.env.TABLE_NAME,
          Key : {
            "text" : {
              "S" : userdata
            },
            "lang": {
              "S": translateTo
            }
          }
      }

      db.getItem(params, (err, data) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(data.Item);
        }
      });
  });
};

// Insert item in dynamodb table
const addItem = (userText, translateTo, translatedText) => {
  return new Promise((resolve, reject) => {
      let params = {
          Item: {
             "text": {
               "S": userText
              },
             "lang": {
                "S": translateTo
              },
             "translated": {
               "S": translatedText
              }
          },
          TableName: process.env.TABLE_NAME
      };
      db.putItem(params, function(err, data) {
         if (err) {
           reject(err);
         }
         else {
           resolve(data);
         }
      });
  });
};

// webhook function handler
module.exports.webhook = (event, context, callback) => {
  if (event.method === 'GET') {
    // fb app verification
    if (event.query['hub.verify_token'] === 'STRONGTOKEN' && event.query['hub.challenge']) {
      return callback(null, parseInt(event.query['hub.challenge']));
    } else {
      return callback('Invalid token');
    }
  }

  // Uses AWS Translate to convert the text to the specific lang
  if (event.method === 'POST') {
      event.body.entry.map((entry) => {
        entry.messaging.map((messagingItem) => {
          if (messagingItem.message && messagingItem.message.text) {
              const accessToken = process.env.ACCESS_TOKEN;
              const url = `https://graph.facebook.com/v2.6/me/messages?access_token=${accessToken}`;

              let splits = (messagingItem.message.text).split('-')
              let text = splits[0]
              let translateTo = splits[1]

              // Checks if the item is present in the table
              exists(text, translateTo).then((item) => {
                console.log(item);
                if (item !== undefined && item !== null) {
                    const payload = {
                        recipient: {
                          id: messagingItem.sender.id
                        },
                        message: {
                          text: item.translated.S
                        }
                    };
                    axios.post(url, payload).then((response) => callback(null, response));
                }
                else {
                  let payload = {}
                  let params = {
                    SourceLanguageCode: 'en',
                    TargetLanguageCode: translateTo.trim(),
                    Text: text
                  }
                  // Call AWS Translate api
                  translate.translateText(params, (err, data) => {
                      if (err) {
                        console.log(err, err.stack);
                      }
                      else {
                        payload = {
                            recipient: {
                              id: messagingItem.sender.id
                            },
                            message: {
                              text: data.TranslatedText
                            }
                        };

                        // Insert the new text in dynamodb table
                        addItem(text, translateTo, data.TranslatedText).then((res) => {
                              console.log(res);
                        });

                        axios.post(url, payload).then((response) => callback(null, response));
                      }
                  });
                }
              }).catch((err) => {
                console.log(err);
              });
          }
        });
      });
    }
};
