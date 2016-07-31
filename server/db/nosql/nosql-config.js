"use strict";
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/ansab');
var post = require("./models/post.server.model.js");
var postType = require("./models/postType.server.model.js");

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("we are connected to Mongo DB!");
});