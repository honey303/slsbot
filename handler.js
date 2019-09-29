'use strict';

const axios = require('axios');
const AWS = require('aws-sdk');

const translate = new AWS.Translate();

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
              const accessToken = 'EAAFU2XUlmxoBAApfKoOXPFxaBAJaYzeIZAbeB2caANkpZCkU0CFwTX4sZC1VjVDxf4gwNhE9QZCVAXHQVFfYnZAvKAuhpyYQX8j2N2dz7F0qoR0ZC2GhZCZBGmMIYb03V6JEvApvZBCiA2UrKwy0pqTcFjUdTYuAzxXXiPjEIvFovyhWUEI5fk1mN';
              const url = `https://graph.facebook.com/v2.6/me/messages?access_token=${accessToken}`;

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
