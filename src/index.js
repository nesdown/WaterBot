'use strict';

const ViberBot = require('viber-bot').Bot;
const BotEvents = require('viber-bot').Events;
const TextMessage = require('viber-bot').Message.Text;
// require('dotenv').config();

const winston = require('winston');
const toYAML = require('winston-console-formatter');
const ngrok = require('./get_public_url');

const createLogger = () => {
  const logger = new winston.Logger({
    level: "debug"
  });

  logger.add(winston.transports.Console, toYAML.config());
  return logger;
};

const logger = createLogger();

if (!process.env.VIBER_PUBLIC_ACCOUNT_ACCESS_TOKEN_KEY) {
  logger.debug('Could not find the Viber account access token key in your environment variable. Please make sure you followed readme guide.');
  return;
}

// Creating the bot with access token, name and avatar
const bot = new ViberBot(logger, {
  authToken: process.env.VIBER_PUBLIC_ACCOUNT_ACCESS_TOKEN_KEY, // Learn how to get your access token at developers.viber.com
  name: "KryoBot",
  avatar: "./bottles.jpg" // Just a placeholder avatar to display the user
});

// The user will get those messages on first registration
bot.onSubscribe(response => {
  say(response, `Hi there ${response.userProfile.name}. 
                 I am ${bot.name}! You can make an order with me!`);
});

bot.on(BotEvents.MESSAGE_RECEIVED, (message, response) => {
  // This sample bot can answer only text messages, let's make sure the user is aware of that.
  if (!(message instanceof TextMessage)) {
    say(response, `Sorry. I can only understand text messages.`);
  }
});

bot.onTextMessage(/./, (message, response) => {
  say(response, `Oh, you say '${message.text}' ?`);
});

const say = (response, message) => {
  response.send(new TextMessage(message));
};

if (process.env.NOW_URL || process.env.HEROKU_URL) {
  const http = require('http');
  const port = process.env.PORT || 8080;

  http.createServer(bot.middleware()).listen(port, () => bot.setWebhook(process.env.NOW_URL || process.env.HEROKU_URL));
} else {
    logger.debug('Could not find the now.sh/Heroku environment variables. Trying to use the local ngrok server.');
    
    return ngrok.getPublicUrl().then(publicUrl => {
    
      const http = require('http');
      const port = process.env.PORT || 8080;

      http.createServer(bot.middleware()).listen(port, () => bot.setWebhook(publicUrl));

    }).catch(error => {
         console.log('Can not connect to ngrok server. Is it running?');
         console.error(error);
         process.exit(1);
    });
}