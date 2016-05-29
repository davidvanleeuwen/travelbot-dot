'use strict';

const router      = require('koa-router');
const parse       = require('co-body');
const request     = require('request');
const token       = process.env.FB_TOKEN;

const data        = [
  {
    question: "Help",
    answers: [{
      text: () => { return data.reduce( (prev, curr) => { return prev += `- ${curr.question}\n` }, '')}
    }]
  },

  {
    question: "yes and please call me Steve",
    answers: [{
      text: "Ok Steve. Shall I use your usual itinerary preferences to manage this roundtrip?"
    }]
  },

  {
    question: "Yes and my girlfriend joins me in Frankfurt, please share my itinerary with her",
    answers: [{
      text: "Ok, I will share your iternary with her."
    }, {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
              "title": "Is this ok?",
              "subtitle": "Confirm your purchase" ,
              "image_url": "https://www.mikeafford.com/store/store-images/ms02_example_heavy_rain_showers.png",
              "buttons": [{
                "type": "postback",
                "title": "Yes",
                "payload": "0" //<- the ID of the interaction to follow up with
              }]
          }]
        }
      }
    }]
  }

]


const interactions = [
  // 0
  {
    notifications: [
      {text: 'Goodmorning Steve. I have done your flight check-in, stored your boarding card and shared itinerary details with Sofia. She is meeting you at Frankfurt airport to catch your connected flight together.'},
      {text: "Fortunately the traffic status is very good. You can leave home around 09.00 am. I'll notify you when your Uber taxi arrives."},
      {text: "And Steve, you might bring your raincoat because the actual weather forecast at destination shows some rain:"},
      {
        "attachment": {
          "type": "template",
          "payload": {
            "template_type": "generic",
            "elements": [{
              "title": "Forecast for Stockholm",
              "subtitle": "Cloudy, 18 degrees.",
              "image_url": "https://s3.amazonaws.com/f.cl.ly/items/1W0C2f0n1n252b1i3k18/card-weather.png",
              "buttons": [{
                  "type": "web_url",
                  "url": "https://weather.com/weather/today/l/SWXX0031:1:SW",
                  "title": "See full forecast"
              }]
            }]
          }
        }
      }
    ]
  },
  // 1
  {
    notifications: [
      {text: "Your Uber is on its way and will arrive on time."}
    ]
  },
  // 2

  {
    notifications: [
      {text: "Welcome at the Airport Steve. Your flight departs from gate 8C at 11.10 am."},
      {text: "It is quite busy so please use the Security filter at Departure A. The queue waiting time there is approx 2 min"},
      {text: "See the required docs enclosed"},
      {
        "attachment": {
          "type": "template",
          "payload": {
            "template_type": "generic",
            "elements": [{
              "title": "Boarding pass to London",
              "subtitle": "i have no clue..",
              "image_url": "http://i.imgur.com/167GMTG.png",
            }]
          }
        }
      }

    ]
  }
]

let sendMessage = function (sender, answers, i, delay) {
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
      if(delay) {
        setTimeout(function() {
          sendMessage(sender, answers, ++i, delay);
        }, delay)
      } else {
        sendMessage(sender, answers, ++i);
      }
    }
  })
}

let reply = function(sender, text) {
  let result = data.find(el => el.question.toLowerCase() === text.toLowerCase());
  if(result) {
    // console.log(sender)
    sendMessage(sender, result.answers, 0);
  }
}

let postback = function(sender, postback) {
  if(parseInt(postback.payload) > -1) {
    let interaction = interactions[parseInt(postback.payload)]

    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: { access_token: token },
      method: 'POST',
      json: {
        recipient: { id: sender },
        message: interaction
      }
    })

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
        if(event.postback)
          postback(event.sender.id, event.postback)
      }

      this.status = 200;
    })
    .get('/webhook', function (next) {
      if (this.query['hub.verify_token'] === 'mecmoc') {
        this.body = this.query['hub.challenge'];
      } else {
        this.status = 500;
      }
    })
    .post('/interaction', function *(next) {
      let body        = yield parse(this);
      let interaction = interactions[body.item];
      let user        = 1049884065076864;

      if(interaction) {
        sendMessage(user, interaction.notifications, 0, 2500);
        this.status = 200;
      }
    })
    .routes()
}
