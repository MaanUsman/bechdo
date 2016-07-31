"use strict";
var sql_db = require('../db/sql/sql-config'),
  userSessionModel = sql_db.userSession;

exports.createSession = function(userId, sessionId) {
  console.log("creating new session");
  return userSessionModel.create({
    session_id: sessionId,
    user_id: userId
  })
  .then(function(ses) {
    console.log(ses.session_id);
    return ses;
  })
  .catch(function(err) {
    return err;
  });
}

exports.validateSession = function(userId) {
  console.log("validating session");
  return userSessionModel.find({
    where: {
      user_id: userId
    }
  })
  .then(function(session) {
    if(session) {
      return session;
    }
    return null;
  })
  .catch(function(err) {
    return err;
  })
}