'use strict';

const router      = require('koa-router');
const parse       = require('co-body');
const request     = require('request');
const token       = "EAAH39ZAlTSckBAEZCxPjH3id9eUZBBuF1lZA9wbEVqNpBmyv9s8ZCPWRZBRGmQiZAxFvGjOkAmlZAA5iBqPt12zZCdAD64b9ZCaWJrZCmswWnIe1A2H8wPHPwaNAVtjnOBauZAKzscT6NfR5g0R2IWLZBiGs3WhRSiWkZCntX9v3a7TlbbmgZDZD";

const data        = [
  {
    question: "Help",
    answers: [{
      text: () => { return data.reduce( (prev, curr) => { return prev += `- ${curr.question}\n` }, '')}
    }]
  },
  {
    question: "Do I need to take my coat?",
    answers: [{
      text: "No, you won’t need it. Here is the weather forecast for New York:"
    }, {
      text: "wahahaa"
    }]
  }
]

let sendMessage = function (sender, answers, i) {
  let messageData = answers[i];
  if(typeof messageData.text === 'function') messageData.text = messageData.text();
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: token },
    method: 'POST',
    json: {
      recipient: { id: sender },
      message: messageData
    }
  }, function(error, response, body) {
    if (!error && i < answers.length-1) {
      sendMessage(sender, answers, ++i);
    }
  })
}

let reply = function(sender, text) {
  let result = data.find(el => el.question.toLowerCase() === text.toLowerCase());
  if(result) {
    sendMessage(sender, result.answers, 0);
  } else {
    sendMessage(sender, [{text: "Sorry, I couldn't really get that. What are you saying?"}], 0);
  }
}

module.exports = function () {
  return router()
    .get('/', function (next) { this.body = 'hello!'})
    .post('/webhook', function *(next) {
      let body      = yield parse(this);
      let events    = body.entry[0].messaging;

      for(let event of events) {
        if(event.message)
          reply(event.sender.id, event.message.text)
      }

      this.status = 200;
    })
    .get('/webhook', function (next) {
      if (this.query['hub.verify_token'] === 'mecmoc_yay') {
        this.body = this.query['hub.challenge'];
      } else {
        this.status = 500;
      }
    })
    .routes()
}