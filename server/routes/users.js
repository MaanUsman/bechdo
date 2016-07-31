"use strict";
var sql_db = require('../db/sql/sql-config'),
  userModel = sql_db.userModel,
  familyModel = sql_db.familyModel,
  generatePassword = require('password-generator'),
  twilio_api = require("../shared/twilio-api"),
  userSessionModel = sql_db.userSession,
  sessionManager = require("../shared/session-manager"),
  tree = require("./tree.js");

exports.getMehrams = function(req, res) {
  console.log("fetch mehram contacts on node");
  tree.fetchMehrams(req.body.currentUser.user_ID, req.body.currentUser.gender, function(error, result) {
    if (error) {
      console.log("error in fetching mehrams");
      console.log(error);
      res.send(400);
    } else {
      console.log("fetched mehram contacts from neo4j");
      var mehrams = transformMehramMembers(result);
      //mehrams.push(req.body.userId);
      res.send(mehrams);
      console.log(mehrams);
    }
  });
}

function transformMehramMembers(members) {
  var mehram_members = [];
  var mehrams = members[0].mehrams;

  for (var key in mehrams) {
    if (mehrams.hasOwnProperty(key)) {
      for (var index = 0; index < mehrams[key].length; index++) {
        mehram_members.push(mehrams[key][index].properties.ansab_id);
      }
    }
  }

  return mehram_members;
}

exports.getUserNameFromId = function(user_ID) {
    let promise = new Promise((resolve, reject) => {
      console.log("inside mysql");
      console.log(user_ID);
      var findUser = userModel.find({
        where: {
          user_ID: user_ID
        },
        include: [familyModel]
      });

      findUser.complete(function(err, user) {
        if (err) {
          reject(error);
        } else if (!user) {
          console.log("user not found");
          resolve("no user found");
        } else {
          resolve(user);
        }
      });
    });
    return promise;
  }
  //Create new family method
exports.authenticateUser = function(req, res) {
  console.log("authenticating user");
  console.log(req.body.phone, req.body.password);
  var findUser = userModel.find({
    where: {
      phone: req.body.phone,
      password: req.body.password
    },
    include: [familyModel]
  });

  findUser.complete(function(err, user) {
    if (err) {
      console.log(err);
      res.send(500);
    } else if (!user) {
      console.log("user not found");
      res.send(404);
    } else {
      sessionManager.createSession(user.user_ID, req.session.id)
        .then(function(response) {
          user.session_id = response.session_id;
          res.send(user);
        })
        .catch(function(err) {
          res.send(err);
        });
    }
  });
}

exports.createNewUser = function(req, res) {
  var existing = req.body.existingMember,
    newMember = req.body.newMember;
  console.log("user recfeived on server");
  console.log(newMember);

  var userPassword = generatePassword(6);

  userModel.create({
    phone: newMember.mobileNumber,
    password: userPassword,
    userType_ID: 2,
    username: newMember.name,
    family_ID: newMember.family_ID,
    gender: newMember.gender,
    is_alive: newMember.aliveStatus
  }).complete(function(err, user) {
    if (err) {
      if (err.name === "SequelizeUniqueConstraintError") {
        res.send(500, "Number already exists");
      }
      console.log(err)
      res.send(500);
    } else {
      //adding user in neo4j ====> family_ID, existingID, newMemberID, newMemberGENDER, relation
      console.log("phone number");
      console.log(user.phone);
      tree.addMember(existing, user, newMember.relation, function(err, results) {
        if (err) {
          console.log('No user found.');
          //res.sendStatus(500);
          res.send(err);
        } else {
          var messageBody = "Your phone number " + newMember.mobileNumber + " has been added to a new family on Ansab. Your password is: " + userPassword + " . Please login to your family on Ansab using this password."
          console.log(messageBody);
          sendMessage(req.body.newMember.mobileNumber, messageBody, function(error, message) {
            if (error) {
              console.log("error in sending message", error);
              //below response needs to be changed...doing it for testing purpose
              res.send(user);
            } else {
              console.log("messsage successfully send");
              res.send(user);
            }
          });
          //res.send(results);
          //res.send(user);
        }
      });

    }
  });

}

function sendMessage(to, body, callback) {
  twilio_api.sendMessage(to, body, callback)
}

exports.setEjabberdId = function(req, res) {
  console.log("setting ejabberd id");
  console.log(req.body);
  var findUser = userModel.find({
    where: {
      user_ID: req.body.user_ID
    }
  });

  findUser.complete(function(err, user) {
    if (err) {
      console.log(err);
      res.send(500);
    } else if (!user) {
      console.log("user not found..");
      res.send(404);
    } else {
      user.updateAttributes({
        ejabberd_id: req.body.jid
      }).complete(function(updatedUser) {
        req.body.ejabberd_id = req.body.jid;
        res.send(req.body);
      })
    }

  });
}

exports.fetchProfileDataById = function(req, res) {
  var findUser = userModel.find({
    where: {
      user_ID: req.body.userId
    },
    include: [familyModel]
  });

  findUser.complete(function(err, user) {
    if (err) {
      res.send(500);
    } else if (!user) {
      console.log("user not found");
      //No user with the username has been found.
      res.send(404);
    } else {
      res.json(user);
    }
  });
}

exports.editUserInfo = function(req, res) {
  console.log("----editing user info ----")
  console.log(req.body);

  if (req.body.fieldType === 'phone') {
    req.body.user.new_password = generatePassword(6);
  }

  var currentUser = req.body.user ? req.body.user : req.body;

  var updateUser = userModel.update(currentUser, {
    where: {
      user_ID: currentUser.user_ID
    }
  });

  updateUser.then(function(user) {
      if (req.body.fieldType === "phone") {
        var messageBody = "Your phone number has been successfully changed to " + currentUser.phone + ". Your new password is: " + currentUser.password + " . Please use this password in order to login to Ansab."
        console.log(messageBody);
        sendMessage(currentUser.phone, messageBody, function(error, message) {
          if (error) {
            console.log("error in sending message", error);
          } else {
            console.log("messsage successfully send");
            res.send(user);
            //res.send(200);
          }
        });
      } else {
        console.log("not sending message");
        res.send(user);
      }
    })
    .catch(function(error) {
      res.send(500, error);
    });
}

exports.findMembersByFamilyId = function(req, res) {
  console.log("inside find memebrs");
  console.log(req.body.family_ID);
  userModel.findAndCountAll({
    where: {
      family_ID: req.body.family_ID
    }
  }).then(function(result) {
    res.send(result);
  })
}

exports.getAllFamilyMembers = function(family_ID) {
  let promise = new Promise((resolve, reject) => {
    var findFamilyMembers = userModel.findAll({
      where: {
        family_ID: family_ID
      }
    });

    findFamilyMembers.complete(function(err, familyMembers) {
      if (err) {
        reject(error);
      } else if (!familyMembers) {
        console.log("familyMembers not found");
        resolve("no familyMembers found");
      } else {
        console.log("family members found !!!!!!!");
        resolve(familyMembers);
      }
    });
  });
  return promise;
}

exports.softDeleteUser = function(req, res) {
  console.log("delete req received on node");
  var findUser = userModel.find({
    where: {
      user_ID: req.body.user_ID
    }
  });

  userModel.update({
    isDeleted: true
  }, {
    where: {
      user_ID: req.body.user_ID
    }
  }).then(function(data) {
    tree.deleteMember(req.body.user_ID, function(err, result) {
      if (err) {
        console.log("error deleting member");
        res.send(err);
      } else {
        console.log("member deleted successfully:  " + result);
        res.send(200);
      }
      //res.send(200);
    });
  }).catch(function(err) {
    res.send(err)
  })
}

exports.editUser = function(req, res) {
  console.log("edit request user on node");

  userModel.update({
    username: req.body.username,
    gender: req.body.gender,
    is_alive: req.body.is_alive,
    phone: req.body.phone,
    email: req.body.email
  }, {
    where: {
      user_ID: req.body.user_ID
    }
  }).then(function(data) {
    // edit gender on neo4j
    console.log("edited on node and moving to neo4j")
    tree.editMember(req.body.user_ID, req.body.gender, function(err, result) {
      if (err) {
        console.log("error editing member");
        res.send(err);
      } else {
        console.log("member edited successfully:  " + result);
        res.send(200);
      }
    })
  }).catch(function(err) {
    res.send(err)
  })
}

exports.editPhone = function(req, res) {
  console.log("changing phone....");
  var currentUser = req.body.user ? req.body.user : req.body;
  var userPassword = generatePassword(6);

  var findUser = userModel.find({
    where: {
      phone: currentUser.new_phone
    }
  });

  findUser.complete(function(err, user) {
    if (err) {
      res.send(500);
    } else if (!user) {
      // res.send(404);
      userModel.update({
        new_phone: currentUser.new_phone,
        new_password: userPassword,
        is_changing_phone: true
      }, {
        where: {
          user_ID: currentUser.user_ID
        }
      }).then(function(data) {
        console.log("member edited" + data);
        //sending message
        var messageBody = "You have requested to change your phone number to " + currentUser.new_phone + ". Your new password is: " + userPassword + " . Please eneter this password in order to permanently change your phone number. Thanks!"
        console.log(messageBody);
        sendMessage(currentUser.new_phone, messageBody, function(error, message) {
          if (error) {
            console.log("error in sending message", error);
            res.send(500);
          } else {
            console.log("messsage successfully send");
            currentUser.new_password = userPassword;
            currentUser.is_changing_phone = true;
            res.send(currentUser);
          }
        });

      }).catch(function(err) {
        res.send(err)
      });
    } else {
      res.send(500);
    }
  });

}

exports.verifyPassword = function(req, res) {
  console.log("changing phone....");
  var currentUser = req.body.user ? req.body.user : req.body;

  userModel.update({
    phone: currentUser.new_phone,
    new_phone: null,
    new_password: "",
    is_changing_phone: false,
    password: currentUser.new_password
  }, {
    where: {
      user_ID: currentUser.user_ID,
      new_password: currentUser.new_password
    }
  }).then(function(data) {
    console.log("member edited" + data);
    currentUser.phone = currentUser.new_phone;
    currentUser.password = currentUser.new_password;
    currentUser.new_password = "";
    currentUser.is_changing_phone = false;
    currentUser.new_phone = null;
    res.send(currentUser);

  }).catch(function(err) {
    res.send(err)
  });
}

exports.findPhoneByJid = function(req, res) {
  console.log("findPhoneByJid.....");
  console.log(req.body);
  var findUser = userModel.find({
    where: {
      ejabberd_id: req.body.jid
    }
  });

  findUser.complete(function(err, user) {
    if (err) {
      res.send(500);
    } else if (!user) {
      res.send(404);
    } else {
      console.log(user);
      res.send(user);
    }
  });
}

exports.findUsersByJid = function(req, res) {
  console.log("find user by jids.....");
  console.log(req.body.jids)
  userModel.findAll({
    where: {
      ejabberd_id: req.body.jids
    }
  }).complete(function(err, members) {
    if (err) {
      res.send(err);
    } else if (!members) {
      console.log("user not found");
      //No user with the username has been found.
      res.send(404);
    } else {
      console.log(members);
      res.send(members);
    }
  });
}