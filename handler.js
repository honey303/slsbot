'use strict';

const axios = require('axios');
const AWS = require('aws-sdk');

const translate = new AWS.Translate();
const db = new AWS.DynamoDB();

// check if the text is already present
const exists = (userdata) => {
  return new Promise((resolve, reject) => {
      var params = {
          TableName : process.env.TABLE_NAME,
          Key : {
            "text" : {
              "S" : userdata
            }
          }
      }

      db.getItem(params, function(err, data) {
          if (err) {
              console.log(err); // an error occurred
              reject(err);
          }
          else {
            console.log(data); // successful response
            resolve(data)
          }
      });
    });
};

// Your first function handler
module.exports.webhook = (event, context, callback) => {
  if (event.method === 'GET') {
    // fb app verification
    if (event.query['hub.verify_token'] === 'STRONGTOKEN' && event.query['hub.challenge']) {
      return callback(null, parseInt(event.query['hub.challenge']));
    } else {
      return callback('Invalid token');
    }
  }

  if (event.method === 'POST') {
      event.body.entry.map((entry) => {
        entry.messaging.map((messagingItem) => {
          if (messagingItem.message && messagingItem.message.text) {
              const accessToken = process.env.ACCESS_TOKEN;
              const url = `https://graph.facebook.com/v2.6/me/messages?access_token=${accessToken}`;

              // Checks if the item is present in the table
              exists(messagingItem.message.text).then((data) => {
                  console.log(data);
              })
              .catch((err) => {
                  console.log('Error', err);
              });

              var params = {
              	SourceLanguageCode: 'en',
              	TargetLanguageCode: 'fr',
              	Text: messagingItem.message.text
              }

              // Translates en text to french
              translate.translateText(params, (err, data) => {
                if (err) {
                  console.log(err, err.stack);
                }
                else {
                  const payload = {
                      recipient: {
                        id: messagingItem.sender.id
                      },
                      message: {
                        text: data.TranslatedText
                      }
                  };
                  axios.post(url, payload).then((response) => callback(null, response));
                }
              });
          }
        });
      });
    }
};
