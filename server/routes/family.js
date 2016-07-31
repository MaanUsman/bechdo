"use strict";
var sql_db = require('../db/sql/sql-config'),
  userModel = sql_db.userModel,
  familyModel = sql_db.familyModel,
  generatePassword = require('password-generator'),
  twilio_api = require("../shared/twilio-api"),
  tree = require("./tree");

//Create new family method
exports.createFamily = function(req, res) {
  console.log(req.body);
  var userPassword = generatePassword(6);
  familyModel.create({
    family_name: req.body.familyName
  }).complete(function(err, family) {
    if (err) {
      console.log('The instance has not been saved:', err)
      //res.send(500);
       if (err.name === "SequelizeUniqueConstraintError") {
          res.send({error: true, message: "Family already exist"});
        }
    } else {
      //Create a new user which will be admin for this family.
      userModel.create({
        phone: req.body.phone,
        password: userPassword,
        gender: true,
        is_alive: true,
        userType_ID: 1,
        username: req.body.familyName + " - Admin",
        family_ID: family.family_ID
      }).complete(function(err, user) {
        if (err) {
          console.log('The instance has not been saved:', err)
          if (err.name === "SequelizeUniqueConstraintError") {
            res.send({error: true, message: "Mobile Number already in use", user});
          }
          //res.send(500);
        } else {
          //adding to neo4j
          console.log("admin created successfully");
          console.log(user);
          tree.createFamily(user.family_ID, user.user_ID, true, function(err, results) {
            console.log("neo4j callback");
            //var result = results[0];
            if (err) {
              console.log('No user found.');
              //res.sendStatus(500);
              res.send(err);
            } else {
              var messageBody = "Your family has been created successfully on Ansab. Here is your password: " + userPassword + ". Please use this password to Login into your family. Thanks!";
              console.log(messageBody);
              sendMessage(req.body.phone, messageBody, function(error, message) {
                console.log(message);
                console.log(error);
                if(error) {
                  console.log("error in sending message", error);
                  res.send(500, error);
                } else {
                  console.log("messsage successfully send");
                  res.send(user);
                }
              });
            }
          })
        }
      });
    }
  });

}

exports.changeFamilyMode = function(req, res) {
  console.log("family type change req received");
  console.log("is_ansab_tree: ");
  console.log(req.body.is_ansab_tree);

  familyModel.update({
    is_ansab_tree: req.body.is_ansab_tree
  }, {
    where: {
      family_ID: req.body.family_ID
    }
  }).then(function(data){
    console.log(data);
    console.log("tree type updated successfully");
    res.send(data);
  }).catch(function(err){
    res.send(err)
  });
}

exports.getFamily = function(family_ID) {
  let promise = new Promise((resolve, reject) => {
    var findFamily = familyModel.find({
      where: {
        family_ID: family_ID
      }
    });

    findFamily.complete(function(err, family) {
      if (err) {
       reject(error);
      } else if (!family) {
        console.log("family not found");
        resolve("no family found");
      } else {
        resolve(family);
      }
    });
  });
  return promise;
}

exports.getFamilyType = function(req, res) {
  console.log("fetch family type req received");
  var findFamily = familyModel.find({
    where: {
      family_ID: req.body.family_ID
    }
  });

  findFamily.complete(function(err, family) {
    if (err) {
      console.log(err);
      res.send(500);
    } else if (!family) {
      console.log("family not found");
      //No family with the username has been found.
      res.send(404);
    } else {
      console.log("family found");
      res.send(family);
    }
  });
}

function sendMessage (to, body, callback) {
  twilio_api.sendMessage(to, body, callback)
}