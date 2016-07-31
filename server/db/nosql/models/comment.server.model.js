var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = new Schema ({
  body: String,
  userID: Number, //Points to the SQL's user id.
  createdOn: { type: Date, default: Date.now },
  username: String
});