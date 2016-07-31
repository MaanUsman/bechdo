"use strict";

var Post = require("../db/nosql/models/post.server.model"),
  sql_db = require('../db/sql/sql-config'),
  userModel = sql_db.userModel,
  _ = require("lodash"),
  sessionManager = require("../shared/session-manager"),
  tree = require("./tree.js"),
  users = require("./users"),
  family = require("./family");

exports.createPost = function(req, res) {
  console.log("_____REQ.BODY");
  sessionManager.validateSession(req.body.userId)
  .then(function(authResponse) {
    var newPost = new Post(req.body.post);
    newPost.mediaFiles = req.body.post.files;
    newPost.postedByUser = authResponse.user_id;
    newPost.userName = req.body.username;
    newPost.inviteFamily = req.body.post.inviteFamily;
    if (req.body.post.womenOnly) {
      newPost.womenOnly = true;
    } else {
      newPost.womenOnly = false;
    }

    if (newPost.postType === "0" && newPost.inviteFamily) {
      console.log("new post with family");
      inviteFamilyMembers(newPost, req.body.familyId,  authResponse.user_id)
      .then(savePost)
      .then(function(error, result) {
        if (error) {
          res.send(500, error);
        } else {
          res.send(result)
        }
      });
    } else {
      console.log("new post wihtout family");
      savePost(newPost)
      .then(function(result, error) {
        if (error) {
          console.log("in error");
          console.log(error);
          res.send(500, error);
        } else {
          console.log("post saved");
          res.send(result);
        }
      });
    }
  })
  .catch(function(err) {
    console.log(err);
  });
}

function savePost(newPost) {
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
}

function inviteFamilyMembers(post, familyId, currentUserId) {
  let promise = new Promise((resolve, reject) => {
    userModel.findAll({
      where: {
        family_ID: familyId,
        user_ID: {
          $ne: currentUserId
        }
      }
    }).complete(function(err, members) {
      if (err) {
        reject(err);
      } else if (!members) {
        console.log("user not found");
        //No user with the username has been found.
        resolve(post);
      } else {
        post.attendees = [];
        if (members) {
          members.forEach(function(member, index, array) {
            post.attendees.push({
              'userID': member.user_ID,
              'status': ""
            });
          });
        }
        resolve(post);
      }
    });

  });
  return promise;
}

exports.fetchPostById = function(req, res) {
  console.log(req.body.postId);
  var data = {
    'post': null,
    'user': null
  };
  Post.findOne({
    '_id': req.body.postId
  }, function(error, post) {
    if (error) {
      res.send(500);
    } else {
      if (!post) {
        res.send(404);
      } else {
        data.post = post;
        userModel.find({
          where: {
            user_ID: post.postedByUser
          }
        }).complete(function(err, user) {
          if (err) {
            res.send(500);
          } else if (!user) {
            console.log("user not found");
            //No user with the username has been found.
            res.send(404);
          } else {
            data.user = user;
            res.json(data);
          }
        });
      }
    }
  });
}

exports.postAddComment = function(req, res) {
  var comment = {
    body: req.body.comment,
    userID: req.body.userId,
    username: req.body.username,
    profilePic: req.body.profile_pic
  };

  Post.findOne({
    '_id': req.body.postId
  }, function(error, post) {
    if (error) {
      res.send(500);
    } else {
      if (!post) {
        res.send(404);
      } else {
        post.comments.push(comment);
        post.save(function(error, post, rowsEffected) {
          if (error) {
            res.send(500, error)
          } else {
            incrementFieldCounter(comment.userID, 'comment_counter', function(err, updatedUser) {
              console.log(err);
              console.log(updatedUser);
              if (err) {
                res.send(500, err);
              } else {
                res.send(updatedUser);
              }
            })
          }
        });
      }
    }
  });
}

exports.postAddLike = function(req, res) {
  Post.findOne({
    '_id': req.body.postId
  }, function(error, post) {
    if (error) {
      res.send(500);
    } else {
      if (!post) {
        res.send(404);
      } else {
        post.likes.push({
          'userID': req.body.userId
        });
        post.save(function(error, post, rowsEffected) {
          if (error) {
            res.send(500, error)
          } else {
            incrementFieldCounter(req.body.userId, 'like_counter', function(err, updatedUser) {
              console.log(err);
              if (err) {
                res.send(500, err);
              } else {
                res.send(post);
              }
            })
          }
        });
      }
    }
  });
}

var incrementFieldCounter = function(userID, field, callback) {
  userModel.find({
    where: {
      user_ID: userID
    }
  }).complete(function(err, user) {
    if (err) {
      callback();
    } else if (!user) {
      //No user with the username has been found.
      callback();
    } else {
      console.log("user not found");
      user.increment(field)
      user.save().complete(callback);
    }
  });
}

exports.unlikePost = function(req, res) {
  Post.findOne({
    '_id': req.body.postId
  }, function(error, post) {
    if (error) {
      res.send(500);
    } else {
      if (!post) {
        res.send(404);
      } else {
        var index = post.likes.indexOf({
          userID: req.body.userId
        });

        post.likes.splice(index, 1);
        post.save(function(error, post, rowsEffected) {
          if (error) {
            res.send(500, error)
          } else {
            decrementLikeCommentCounter(req.body.userId, 'like_counter', function(err, updatedUser) {
              console.log(err);
              if (err) {
                res.send(500, err);
              } else {
                res.send(post);
              }
            })
          }
        });
      }
    }
  });
}

var decrementLikeCommentCounter = function(userID, field, callback) {
  console.log(field);
  console.log(userID);
  userModel.find({
    where: {
      user_ID: userID
    }
  }).complete(function(err, user) {
    if (err) {
      callback();
    } else if (!user) {
      //No user with the username has been found.
      callback();
    } else {
      console.log("user not found");
      user.decrement(field)
      user.save().complete(callback);
    }
  });
}

function transformMehramMembers(members) {
    var mehram_members = [];
    var mehrams = members[0].mehrams;

    for (var key in mehrams) {
      if (mehrams.hasOwnProperty(key)) {
        for (var index = 0; index < mehrams[key].length; index ++) {
          mehram_members.push(mehrams[key][index].properties.ansab_id);
        }
      }
    }

    return mehram_members;
  }

  function transformFamilyMembers (members) {
    var transformedMembers = [];
    for (var index = 0; index < members.length; index ++) {
      transformedMembers.push(members[index].dataValues.user_ID)
    }

    return transformedMembers;
  }

exports.fetchAllPosts = function(req, res) {
  var mehrams;
  var page = req.body.page * 10;

  family.getFamily(req.body.family_ID)
  .then((family) => {
    if ((!family.is_ansab_tree) || (!req.body.gender)) {
      console.log("fetching all family members")
      users.getAllFamilyMembers(req.body.family_ID)
      .then((members) => {
        var transformedMembers = transformFamilyMembers(members);
        if(req.body.gender) {
          var query = {
            'postedByUser': {
              $in: transformedMembers
            },
            "womenOnly": false
          }
        } else {
          var query = {
            'postedByUser': {
              $in: transformedMembers
            }
          }
        }

        Post.find(query)
        .limit(10)
        .skip(page)
        .sort({
          createdOn: 'desc'
        })
        .exec(function(error, posts) {
          // console.log(posts);
          // res.send(posts);
          if (error) {
            console.log(error);
            res.send(500);
          } else {
            if (!posts) {
              res.send(404);
            } else {
              console.log("posts found");
              res.send(posts);
            }
          }
        });
      })
      .catch((err) => {
        res.send(500);
      })
    } else {
      tree.fetchMehrams(req.body.userId, req.body.gender, function(error, result) {
        if (error) {
          console.log("error in fetching mehrams");
          console.log(error);
        } else {
          mehrams = transformMehramMembers(result);
          mehrams.push(req.body.userId);

          if(req.body.gender) {
            var query = {
              'postedByUser': {
                $in: mehrams
              },
              "womenOnly": false
            }
          } else {
            var query = {
              'postedByUser': {
                $in: mehrams
              }
            }
          }

          Post.find(query)
          .limit(10)
          .skip(page)
          .sort({
            createdOn: 'desc'
          })
          .exec(function(error, posts) {
            if (error) {
              console.log(error);
              res.send(500);
            } else {
              if (!posts) {
                res.send(404);
              } else {
                console.log("posts found inside mehram check");
                res.send(posts);
              }
            }
          });
        }
      });
    }
  })
  .catch((err) => {
    res.send(500);
  });
}

exports.fetchUserUpcomingEvents = function(req, res) {
  sessionManager.validateSession(req.body.userId)
  .then(function(authResponse) {
    var currentAttendee = {
      userID: authResponse.user_id,
      status: ""
    }

    Post.find({
      'postType': '0',
      'eventTime': {
        $gt: new Date()
      },
      'attendees': {
        $elemMatch: currentAttendee
      }
    })
    .sort({
      createdOn: 'desc'
    })
    .exec(function(error, events) {
      if (error) {
        res.send(500);
      } else {
        if (!events) {
          res.send(404);
        } else {
          res.send(events);
        }
      }
    });
  })
  .catch(function(err) {

  });
}


/*exports.fetchLatestPostsCount = function(req, res) {
  console.log("fetching latest posts count");
  tree.fetchMehrams(req.body.userId, req.body.gender, function(error, result) {
    if (error) {
      console.log("error in fetching mehrams");
      console.log(error);
    } else {
      var mehrams = transformMehramMembers(result);
      mehrams.push(req.body.userId);
      console.log("mehrams tranformed");
      console.log(mehrams);
      Post.count({
        'postedByUser': {
          $in: mehrams
        },
        'createdOn': {
          $gt: req.body.lastUpdated
        }
      }, function(error, newPostsCount) {
        if (error) {
          console.log(error);
          res.send(500);
        } else {
          if (!newPostsCount) {
            res.send(404);
          } else {
            console.log("newPostsCount", newPostsCount);
            res.send({
              newPostsCount: newPostsCount
            });
          }
        }
      });
    }
  });
}*/

exports.fetchLatestPostsCount = function(req, res) {
  var mehrams;

  family.getFamily(req.body.family_ID)
  .then((family) => {
    if ((!family.is_ansab_tree) || (!req.body.gender)) {
      console.log("fetching all family members")
      users.getAllFamilyMembers(req.body.family_ID)
      .then((members) => {
        var transformedMembers = transformFamilyMembers(members);

        if(req.body.gender) {
          var query = {
            'postedByUser': {
              $in: transformedMembers,
              $ne: req.body.userId
            },
            'createdOn': {
              $gt: req.body.lastUpdated
            },
            womenOnly: false
          }
        } else {
             var query = {
              'postedByUser': {
                $in: transformedMembers,
                $ne: req.body.userId
              },
              'createdOn': {
                $gt: req.body.lastUpdated
              }
            }
          }

        Post.count(query, function(error, newPostsCount) {
          if (error) {
            console.log(error);
            res.send(500);
          } else {
            if (!newPostsCount) {
              console.log("no new post found");
              res.send(404);
            } else {
              console.log("newPostsCount", newPostsCount);
              res.send({
                newPostsCount: newPostsCount
              });
            }
          }
        });
      })
      .catch((err) => {
        res.send(500);
      })
    } else {
      tree.fetchMehrams(req.body.userId, req.body.gender, function(error, result) {
        if (error) {
          console.log("error in fetching mehrams");
          console.log(error);
        } else {
          mehrams = transformMehramMembers(result);

          if(req.body.gender) {
            var query = {
              'postedByUser': {
                $in: mehrams,
                $ne: req.body.userId
              },
              'createdOn': {
                $gt: req.body.lastUpdated
              },
              womenOnly: false
            }
          } else {
               var query = {
                'postedByUser': {
                  $in: mehrams,
                  $ne: req.body.userId
                },
                'createdOn': {
                  $gt: req.body.lastUpdated
                }
              }
            }

          Post.count(query, function(error, newPostsCount) {
              if (error) {
                console.log(error);
                res.send(500);
              } else {
                if (!newPostsCount) {
                  console.log("no new post found");
                  res.send(404);
                } else {
                  console.log("newPostsCount", newPostsCount);
                  res.send({
                    newPostsCount: newPostsCount
                  });
                  }
                }
          });
        }
      });
    }
  })
  .catch((err) => {
    res.send(500);
  });
}

exports.fetchNewCommentsByPost = function(req, res) {
  console.log("fetching post new comments");
  var newComments = [];
  Post.findOne({
    '_id': req.body.postId
  }, function(error, post) {
    if (error) {
      res.send(500);
    } else {
      if (!post) {
        res.send(404);
      } else {
        post.comments.forEach(function(comment, index, array) {
          if ((comment.createdOn.toISOString() > req.body.lastUpdated) && (comment.userID != req.body.userId)) {
            newComments.push(comment);
          }
        });
        res.send(newComments);
      }
    }
  });
}

exports.setEventResponse = function(req, res) {
  console.log(req.body);

  Post.findOne({
    '_id': req.body.postId
  }, function(error, post) {
    if (error) {
      res.send(500);
    } else {
      if (!post) {
        res.send(404);
      } else {
        var index = _.indexOf(post.attendees, _.find(post.attendees, {
          userID: req.body.userId
        }));

        if (index != -1) {
          post.attendees.splice(index, 1, {
            userID: req.body.userId,
            status: req.body.status
          });
        }

        post.save(function(error, post, rowsEffected) {
          if (error) {
            console.log("savePost error");
            console.log(error);
            res.send(500, error);
          } else {
            res.send(post);
          }
        });
      }
    }
  });
}

exports.getMediaById = function(req, res) {
  if (req.body.gender) {
    var query = {
      'postedByUser': req.body.userId,
      "womenOnly": false,
      "mediaFiles": {
        $exists: true,
        $ne: []
      },
      "mediaFiles.type": {
        $ne: "audio"
      }
    }
  } else {
    var query = {
      'postedByUser': req.body.userId,
      'mediaFiles': {
        $exists: true,
        $ne: []
      },
      'mediaFiles.type': {
        $ne: 'audio'
      }
    }
  }

  Post.find(query)
  .limit(9)
  .sort({
    createdOn: 'desc'
  })
  .exec(function(error, posts) {
    if (error) {
      console.log(error);
      res.send(500);
    } else {
      if (!posts) {
        res.send(404);
      } else {
        res.send(posts);
      }
    }
  });
}