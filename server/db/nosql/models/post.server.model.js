var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var PostType = require("./postType.server.model");

//Sub document which will be embedded in Post
var CommentSchema = require("./comment.server.model.js")

//Post Schema
var PostSchema = new Schema({
  title: String,
  description: String,
  postedByUser: Number,
  userName: String,
  createdOn: {
    type: Date,
    default: Date.now
  },
  likes: {
    type: Array
  },
  mediaFiles: {
    type: Array
  },
  location: {
    address: String,
    latitude: String,
    longitude: String
  },
  comments: [CommentSchema],
  postType: {
    type: String
  },
  womenOnly: Boolean,
  gender: Boolean,
  inviteFamily: Boolean,
  attendees: {
    type: Array
  },
  eventTime: {
    type: Date,
    default: Date.now
  },
  birthDate: Date,
  birthTime: Date
});

module.exports = mongoose.model('Post', PostSchema);