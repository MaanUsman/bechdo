"use strict";

// Your accountSid and authToken from twilio.com/user/account
var accountSid = 'ACae0d2dda726e80098c899c5d17ddc346';
var authToken = "065f27eda3fb8afc95835ef192b85303";
var client = require('twilio')(accountSid, authToken);

exports.sendMessage = function(to, body, callback) {
  client.messages.create({
    body: body,
    to: to,
    from: "+14847023462"
  }, callback);
}