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
    },{
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
              }],
          }]
        }
      }]
  },

  {
    question: "Maybe, can you show me his LinkedIn profile?",
    answers: [{
      text: "Here it is"
    },
    {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
              "title": "Frans van Houten",
              "subtitle": "CEO Philips",
              "image_url": "http://www.householdappliancesworld.com/files/2015/01/Philips-Frans-van-Houten.jpg",
              "buttons": [{
                  "type": "web_url",
                  "url": "https://www.linkedin.com/in/joost-leeflang-4291521?trk=seokp-title_posts_secondary_cluster_res_author_name",
                  "title": "View on LinkedIn"
              }],
          }]
        }
      }
    }]
  },

  {
    question: "I would like to meet him. Could you give me directions?",
    answers: [{
      text: "Yes, I will show you."
    },
    {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
              "title": "Directions to meet Frans",
              "subtitle": "Directions",
              "image_url": "http://www.techmerry.com/wp-content/uploads/2014/08/Implement-GPS-data-for-your-Google-MAP.gif",
              "buttons": [{
                  "type": "web_url",
                  "url": "https://www.some-airline.com",
                  "title": "View on Airline Application"
              }],
          }],
        },
      },
    }]
  },

  {
    question: "No, I will be okay. Could you remind me to start walking at 10:30AM?",
    answers: [{
      text: "I will Steve."
    }]
  },

  {
    question: "I’m bored.",
    answers: [{
      text: "Here are some personal recommendations. I found articles on the subject of your conference. There are some blogs of speakers on LinkedIn."
    }]
  },

  {
    question: "Yes please, 6:30 AM",
    answers: [{
      text: "ok done."
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
      {text: "Steve would you like to visit the business lounge? There are 4 other people there who are also visiting the conference you are going to. For example the Director of Engineering of LinkedIn:"}
    ]
  },
  // 3
  {
    notifications: [
      {text: "Steve, you have to be at gate 3B at 11AM. It will take a 15 minutes to walk to the gate. Do you want me to give you directions?"}
    ]
  },
  // 4
  {
    notifications: [
      {text: "Steve, it is time to start walking. Please let me know if you are in the need of directions."}
    ]
  },
  // 5
  {
    notifications: [
      {text: "your seat is in row 2B. You can take the front door of the plane. The nearest emergency exit is in front of you on the left side of the plane."}
    ]
  },
  // 6
  {
    notifications: [
      {text: "Steve, you have been sitting for 3 hours. You might want to take a walk and stretch your legs. Maybe get some water to keep you hydrated."}
    ]
  },
  // 7
  {
    notifications: [
      {text: "Oh no, Steve, there was a problem with your connecting flight in Amsterdam. It has been cancelled. No worries, I have found an alternative flight. I’ve changed your journey and you will be on time for your conference!"}
    ]
  },
  // 8
  {
    notifications: [
      {text: "Here are your new details."}
    ]
  },
  // 9
  {
    notifications: [
      {text: "Don’t forget to pack your stuff. Your Uber is arriving at 8AM. Would you like me to set an alarm?"}
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
