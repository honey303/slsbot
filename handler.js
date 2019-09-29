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

            // const quotes = [
            //   'Don\'t cry because it\'s over, smile because it happened. - Dr. Seuss',
            //   'Be yourself; everyone else is already taken. - Oscar Wilde',
            //   'Two things are infinite: the universe and human stupidity; and I\'m not sure about the universe. - Albert Einstein',
            //   'Be who you are and say what you feel, because those who mind don\'t matter, and those who matter don\'t mind. - Bernard M. Baruch',
            //   'So many books, so little time. - Frank Zappa',
            //   'A room without books is like a body without a soul. - Marcus Tullius Cicero'
            // ];
            //
            // const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

                // const payload = {
            //   recipient: {
            //     id: messagingItem.sender.id
            //   },
            //   message: {
            //     text: randomQuote
            //   }
            // };
            //
            // axios.post(url, payload).then((response) => callback(null, response));
          }
        });
      });
    }
};
