var Post = require("../models/post.server.model");

exports.create = function( req, res) {
  var newPost = new Post {
    title: req.body.title,
    description: req.body.description
  }

  newPost.save();
  res.send(200);
}