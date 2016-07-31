var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PostType = new Schema({
  name: String
});

module.exports = mongoose.model('PostType', PostType);;