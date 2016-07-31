"use strict";

"use strict";
var sql_db = require('../db/sql/sql-config'),
  userModel = sql_db.userModel,
  contactModel = sql_db.contactModel,
  _ = require("lodash"),
  sequelize = sql_db.sequelize,
  sessionManager = require("../shared/session-manager");

exports.mapPhoneContactsWithXmppContacts = function(req, res) {
  console.log('mapping contacts');
  //console.log(req.body);
  var phoneContacts = req.body,
    counter = 0,
    updatedContacts = [];

  phoneContacts.forEach(function(contact, index, array) {
    if (contact.phoneNumbers.length > 0) {
      console.log(contact.phoneNumbers[0].number.replace(/\s/g, ""));
      userModel.find({
        where: {
          phone: contact.phoneNumbers[0].number.replace(/\s/g, ""),
          ejabberd_id: contact.phoneNumbers[0].number.replace(/\s/g, "")
        }
      }).complete(function(err, user) {
        if (err) {

        } else if (!user) {
          console.log("user not found");
          //No user with the username has been found.
          contact.sql_id = null;
          contact.family_id = null;
        } else {
          contact.isAnsabUser = true;
          contact.sql_id = user.user_ID;
          contact.family_id = user.family_ID;
          contact.ejabberd_id = user.ejabberd_id;
        }
        if (counter === phoneContacts.length - 1) {
          res.send(phoneContacts);
        }
        counter++;
      });

    } else {
      counter++;
    }
  });
}

exports.updateContactsToDatabase = function(req, res) {
  console.log('updating contacts');
  console.log(req.body);
  //console.log(req.body);
  sessionManager.validateSession(req.body.userId)
  .then(function(authResponse) {
    var phoneContacts = req.body.contacts,
      counter = 0,
      phoneList = [],
      dbContacts = [],
      deletedContacts = _.filter(phoneContacts, {
        'isDeleted': true
      }),
      addedContacts = _.filter(phoneContacts, "isAdded");

    var counter = 0;
    phoneContacts.forEach(function(phoneContact, index, array) {
      console.log("--------------- New contact started ---------");
      if(phoneContact.isAdded) {
        addContactToContactList(phoneContact, authResponse.user_id)
        .then((addResponse) => {
          //console.log(counter, phoneContacts.length, index);
          if (counter === phoneContacts.length - 1) {
            res.send(phoneContacts);
          }
          counter++;
        });

      } else if(phoneContact.isDeleted) {
        deleteContactFromContactList(phoneContact, authResponse.user_id)
        .then((deleteResponse) => {
          if (counter === phoneContacts.length - 1) {
            res.send(phoneContacts);
          }
          counter++;
        });
      }

    })

  })
  .catch(function(err) {

  });
}

function deleteContactFromContactList(phoneContact, currendUserId) {
  let promise = new Promise((resolve, reject) => {
    contactModel.find({
      where: {
        contact_ID: phoneContact.ansab_id,
        user_ID: currendUserId
      }
    }).complete(function(err, ansabContact) {
      if(ansabContact) {
        ansabContact.destroy();
      }
      resolve(ansabContact);
    })
  });
  return promise;
}

function addContactToContactList(phoneContact, currendUserId) {
  let promise = new Promise((resolve, reject) => {
    userModel.find({
      where: {
        phone: phoneContact.number,
        isDeleted: false,
        ejabberd_id: {
          $ne: null
        }
      }
    }).complete(function(error, ansabContact) {
      if(ansabContact) {
        contactModel.create({
          user_ID: currendUserId,
          contact_ID: ansabContact.user_ID
        }).complete(function(err, result) {
          phoneContact.is_ansab_user = true;
          phoneContact.profile_pic = ansabContact.profile_pic;
          phoneContact.jid = ansabContact.ejabberd_id;
          phoneContact.family_id = ansabContact.family_ID;
          phoneContact.ansab_id = ansabContact.user_ID;
          resolve(phoneContact);
        });
      } else {
        phoneContact.is_ansab_user = false;
        resolve(phoneContact);
      }
    });
  });
  return promise;
}

exports.syncContactsWithAnsab = function(req, res) {
  console.log("syncing contacts....");
  console.log(req.body.phonesJson);
  var phones = [];
  for (let i = 0; i < req.body.phonesJson.length; i++) {
    phones.push(req.body.phonesJson[i].phone);
  }

  console.log(phones);
  userModel.findAll({
    where: {
      phone: {
        $in: phones
      },
      isDeleted: false,
      ejabberd_id: {
        $ne: null
      }
    }
  }).complete(function(err, contacts) {
    if (err) {
      res.send(err);
    } else if (!contacts) {
      console.log("user not found");
      //No user with the username has been found.
      res.send(404);
    } else {
      console.log(contacts);
      res.send(contacts);
    }
  });
}

exports.getAnsabContacts = function(req, res) {
  console.log("syncing contacts....");
  console.log(req.body);

  var query = {
    family_ID: req.body.familyId,
    isDeleted: false,
    is_alive: true,
    user_ID: {
      $ne: req.body.userId
    },
  }

  if(req.body.lastUpdated) {
    query = Object.assign(query, {updatedAt: {
      $gt: req.body.lastUpdated
    }})
  }
  userModel.findAll({
    where: query
  }).complete(function(err, contacts) {
    if (err) {
      res.send(err);
    } else if (!contacts) {
      console.log("user not found");
      //No user with the username has been found.
      res.send(404);
    } else {
      res.send(contacts);
    }
  });
}