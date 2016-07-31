"use strict";
var sql_db = require('../db/sql/sql-config'),
  userModel = sql_db.userModel,
  familyModel = sql_db.familyModel,
  groupModel = sql_db.groupModel,
  sessionManager = require("../shared/session-manager");

function _addParticipants (group, participants) {
  var counter = 0;
}

exports.createNewGroup = function(req, res) {
  sessionManager.validateSession(req.body.userId)
  .then(function(authResponse) {
    req.body.participants && authResponse.user_id && req.body.participants.push(authResponse.user_id);
    var newGroup = {
      group_name: req.body.group.groupName,
      jid: req.body.group.jid,
      group_pic: req.body.group.group_pic
    },
    participants = req.body.participants;

    groupModel.create(newGroup)
    .then(function(group) {
      group.setUsers(participants);
      res.send(group);
    })
    .catch(function(error) {
      res.send(500);
    });
  })
  .catch(function(err) {

  });
}

exports.addParticipants = function(req, res) {
  console.log("participants");

}