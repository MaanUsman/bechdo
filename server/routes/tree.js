"use strict";

var db = require("../db/neo4j/neo4j-config.js");

exports.createFamily = function(family_ID, user_ID, gender, callback) {
  db.cypher({
    query: 'CREATE (n:Family { family_ID: '+ family_ID +' }) CREATE (newMember: Member {ansab_id: '+ user_ID +' , gender: '+ gender +' })<-[:Parent]-(n) return n;',
    params: {},
  }, callback);
}

exports.fetchMehrams = function(user_ID, gender, callback) {
  db.cypher({
    query: 'optional match(user{ansab_id: '+ user_ID +'})-[*]-(allMembers) where allMembers.gender='+ gender +' optional match(user2{ansab_id: '+ user_ID +'})<-[:Parent*]-(ancestors) where ancestors.gender='+ !gender +' optional match(user3{ansab_id: '+ user_ID +'})-[:Parent*]->(descendants) where descendants.gender='+ !gender +' optional match(user4{ansab_id: '+ user_ID +'})<-[:Parent]-(parent) optional match s=(parent)-[:Parent*]->(siblingsAndDescendants) WHERE NONE (x IN nodes(s) WHERE x=user4) and siblingsAndDescendants.gender='+ !gender +' optional match (user5{ansab_id: '+ user_ID +'})<-[:Parent]-(parent) optional match (parent)<-[:Parent]-(grandParent) optional match ps=(grandParent)-[:Parent]->(parentsSiblings) WHERE parentsSiblings.gender='+ !gender +' return {allMembers: collect(distinct allMembers), ancestors: collect(distinct ancestors), descendants: collect(distinct descendants),siblingsAndDescendants: collect(distinct siblingsAndDescendants),parentsSiblings: collect(distinct parentsSiblings)} as mehrams',
    params: {},
  }, callback);
}

exports.fetchTree = function(req, res) {
  console.log("Fetch tree req received");
  console.log(req.body.family_ID);

  db.cypher({
    query: 'match(family: Family {family_ID: ' + req.body.family_ID + '})-[:Parent]->(headOfTheFamily)  optional MATCH (headOfTheFamily)-[:Parent]->(child)   optional match  (child)-[:Parent]->(grandchild)   optional match (grandchild)-[:Parent]->(greatGrandChild)   optional match (greatGrandChild)-[:Parent]->(childOfGreatGrandChild)  optional match(childOfGreatGrandChild)-[:Parent]->(sixthLevelChild)  optional match(sixthLevelChild)-[:Parent]->(seventhLevelChild)  with headOfTheFamily, child, grandchild, greatGrandChild,childOfGreatGrandChild, sixthLevelChild, {name: sixthLevelChild, seventhLevelChildren: case when seventhLevelChild is not null then collect (seventhLevelChild) else null end } as seventhLevelChildren with headOfTheFamily, child, grandchild, greatGrandChild,childOfGreatGrandChild, {name: childOfGreatGrandChild, sixthLevelChildren: case when seventhLevelChildren is not null then collect (seventhLevelChildren) else null end } as sixthLevelChildren  with headOfTheFamily, child, grandchild ,{name: greatGrandChild, childrenOfGreatGrandChild: case when sixthLevelChildren is not null then collect(sixthLevelChildren) else null end} as childrenOfGreatGrandChildren WITH headOfTheFamily,child, {name: grandchild, ggchildren: case when childrenOfGreatGrandChildren is not null then collect(childrenOfGreatGrandChildren) else null end} as ggchildren  with headOfTheFamily, child, case when ggchildren is not null then collect(ggchildren) else null end  as greatGrandChildren RETURN {name:headOfTheFamily, kids:collect({name:child, parent:  greatGrandChildren })} as document ',
    params: {},
  }, function(err, results) {
     if (err) throw err;
     var result = results[0];
     console.log(results);
     if (!result) {
      console.log('No user found.');
      res.send("No user found");
    } else {
      //console.log(user);
      res.send(result);
    }
  });
}

exports.getDepth = function(req, res) {
  var query = "";

  query = 'MATCH (family:Family {family_ID: ' + req.body.family_ID + '})-[r*]->(n)WITH n, LENGTH(r) AS depth RETURN collect(depth) as treeDepth'

  db.cypher({
    query: query,
    params: {},
  }, function(error, results) {
      if (error) throw err;
     var result = results[0];
     if (!result) {
      console.log('No depth found.');
      res.send("No depth found");
    } else {
      console.log(result);
      res.send(result);
    }
  });
}

exports.addMember = function(existingMember_id, newMember, relation, callback) {
  var query = "";

  if (relation === "Parent") {
    query = 'Match(existingMember {ansab_id: ' + existingMember_id + '})<-[rel:Parent]-(parent) CREATE (newMember: Member {ansab_id: ' + newMember.user_ID + ', gender: ' + newMember.gender + '})-[:Parent ]->(existingMember) CREATE (newMember)<-[:Parent ]-(parent) delete rel;'
  } else {
    query = 'MATCH (existingMember: Member {ansab_id:' + existingMember_id + '}) CREATE (newMember: Member {ansab_id: '+ newMember.user_ID + ' , gender: '+ newMember.gender + ' })<-[:Parent]-(existingMember) RETURN newMember';
  }

  db.cypher({
    query: query,
    params: {},
  }, callback);
}

exports.editMember = function(ansab_id, gender, callback) {
  console.log("Member edit on neo4j");
  console.log(ansab_id + gender);

  db.cypher({
    query: 'MATCH (member: Member {ansab_id:' + ansab_id + '}) SET  member.gender=' + gender + '',
    params: {},
  }, callback);
}

exports.deleteMember = function(ansab_id, callback) {
  console.log("deleting on neo4j!");
  console.log("member:  " + ansab_id);
  db.cypher({
    query: 'MATCH (member: Member ) WHERE member.ansab_id='+ansab_id+' DETACH DELETE member',
    params: {
    },
  }, callback);
}

function returnMember(err, results) {
  if (err) throw err;
  var result = results[0];
  if (!result) {
    console.log('No user found.');
    //res.sendStatus(500);
  } else {
    var user = result['user'];
    console.log(user);
    //res.send(user);
  }
};

/*function addMember(member) {
  console.log("newPost");
  // console.log(newPost.mediaFiles);
  // console.log(newPost.mediaFiles[0].mediaUrl);
  let promise = new Promise((resolve, reject) => {
    newPost.save(function(error, post, rowsEffected) {
      if (error) {
        console.log("savePost error");
        console.log(error);
        reject(error);
      } else {
        incrementFieldCounter(newPost.postedByUser, 'post_counter', function(err, updatedUser) {
          if (err) {
            reject(err);
          } else {
            resolve(newPost);
          }
        });
      }
    });
  });
  return promise;
}*/

/*exports.createPost = function(req, res) {
  console.log("_____REQ.BODY");
  var newPost = new Post({
    title: req.body.title,
    description: req.body.description,
    postedByUser: req.session.user.user_ID,
    mediaFiles: req.body.files,
    location: req.body.location,
    postType: req.body.postType,
    womenOnly: req.body.womenOnly,
    gender: req.body.gender,
    birthDate: req.body.birthDate,
    birthTime: req.body.birthTime,
    eventTime: req.body.eventTime
  });

  if (newPost.postType === "0") {
    console.log("event type");
    inviteFamilyMembers(newPost, req.session.user.family_ID, req.session.user.user_ID)
      .then(savePost)
      .then(function(error, result) {
        console.log("POST SAVED");
        // console.log(result);
        if (error) {
          res.send(500, error);
        } else {
          res.send(result)
        }
      });
  } else {
    savePost(newPost)
      .then(function(result, error) {
        console.log("POST SAVED");
        // console.log(result);
        if (error) {
          console.log("in error");
          console.log(error);
          res.send(500, error);
        } else {
          console.log("NO error");
          res.send(result);
        }
      });
  }
}*/