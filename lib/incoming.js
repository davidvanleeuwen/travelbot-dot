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
    question: "Do I need to take my coat?",
    answers: [{
      text: "No, you won’t need it. Here is the weather forecast for New York:"
    }, {
      text: "wahahaa"
    }]
  },

  {
    question: "DOT, I can’t find my travel plug. Can you please help me?",
    answers: [{
      text: "Of course I can. I bought one for you, it will be in your hotelroom when you arrive."
    }]
  },

  {
    question: "Maybe, can you show me his LinkedIn profile?",
    answers: [{
      text: "Here it is <<linked in profile thing>>"
    }]
  },

  {
    question: "I would like to meet him. Could you give me directions?",
    answers: [{
      text: "Yes, I will show you << directions on airport>>"
    }]
  },

  {
    question: "No, I will be okay. Could you remind me to start walking at 10:30AM?",
    answers: [{
      text: "I will Steve."
    }]
  },

  {
    question: "DOT, I’m bored.",
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
  {
    text: "  Good morning Steve! Today is your journey. Do you have everything you need?" +
              "Here is a list of the things you need based on the primary needs." +
              "- toothbrush"+
              "- Ipad"+
              "- persoonlijke dingen"+
              "- travel plug"
  },
  {
    text: "your Uber is on it’s way and will arrive right on time."
  },

  {
    text: "Steve would you like to visit the business lounge? There are 4 other people there who are also visiting the conference you are going to. For example the CEO of Philips."
  },

  {
    text: "Steve, you have to be at gate 3B at 11AM. It will take a 15 minutes to walk to the gate. Do you want me to give you directions?"
  },

  {
    text: "Steve, it is time to start walking. Please let me know if you are in the need of directions."
  },

  {
    text: "your seat is in row 2B. You can take the front door of the plane. The nearest emergency exit is in front of you on the left side of the plane."
  },

  {
    text: "Steve, you have been sitting for 3 hours. You might want to take a walk and stretch your legs. Maybe get some water to keep you hydrated."
  },

  {
    text: "Oh no, Steve, there was a problem with your connecting flight in Amsterdam. It has been cancelled. No worries, I have found an alternative flight. I’ve changed your journey and you will be on time for your conference!"
  },

  {
    text: "Here are your new details."
  },

  {
    text: "Don’t forget to pack your stuff. Your Uber is arriving at 8AM. Would you like me to set an alarm?"
  }

]

let sendMessage = function (sender, answers, i) {

  console.log('should be sending answer: ');
  console.log(answer);

  let messageData = answers[i];
  if(typeof messageData.text === 'function') messageData.text = messageData.text();

  return //lol
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
