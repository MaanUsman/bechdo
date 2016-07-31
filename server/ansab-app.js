var express = require("express"),
  fs = require('fs'),
  compression = require('compression'),
  http = require('http'),
  app = express(),
  session = require('express-session'),
  zlib = require('zlib'),
  sql_config = require('./db/sql/sql-config'),
  nosql_config = require('./db/nosql/nosql-config'),
  bodyParser = require("body-parser"),
  family = require("./routes/family"),
  users = require("./routes/users"),
  post = require("./routes/post"),
  contact = require("./routes/contact"),
  group = require("./routes/group"),
  tree = require("./routes/tree");

gzip = zlib.createGzip();
app.use(compression())
app.use(express.static("./tree"));

//initialization of session
app.use(session({
  secret: 'cookie_secret',
  name: 'cookie_name',
  proxy: true,
  resave: true,
  saveUninitialized: true
}));

require('dotq');
app.use(require('express-promise')());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser({
  limit: '50mb'
}));

app.get("/", function(req, res) {
  res.send("Hello world");
})

app.
get("/render-tree", function(req, res) {
  res.sendfile("./tree/index.html");
})


//adding permissions to allow the express app to accept the requests form other domains
app.all('/*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,HEAD,DELETE,OPTIONS');
  req.headers['X-Forwarded-For', {
    'accept-encoding': 'gzip,deflate'
  }]
  req.headers['X-Forwarded-For', {
    'content-encoding': 'gzip,deflate'
  }]
  next();
});


//routes defined here
app.post("/create-family", family.createFamily);
app.post("/change-family-mode", family.changeFamilyMode);
app.post("/get-family-type", family.getFamilyType);

app.post("/auth-user", users.authenticateUser);
app.post("/create-user", users.createNewUser);
app.post("/profile-data-by-id", users.fetchProfileDataById);
app.post("/edit-user-info", users.editUserInfo);
app.post("/edit-user", users.editUser);
app.post("/delete-member", users.softDeleteUser);
app.post("/find-members", users.findMembersByFamilyId)
app.post("/edit-user-phone", users.editPhone);
app.post("/verify-password", users.verifyPassword);
app.post("/get-phone-by-jid", users.findPhoneByJid);
app.post("/get-users-by-jid", users.findUsersByJid)
app.post("/get-mehrams", users.getMehrams);
app.post("/get-media-by-id", post.getMediaById);

app.post("/set-ejabberdid", users.setEjabberdId);
app.post("/map-phone-contacts-with-xmpp-contacts", contact.mapPhoneContactsWithXmppContacts);
app.post('/update-contacts', contact.updateContactsToDatabase);
app.post("/sync-contacts-with-ansab", contact.syncContactsWithAnsab);
app.post("/get-ansab-contacts", contact.getAnsabContacts);

app.post("/post", post.createPost);
app.post("/get-post-by-id", post.fetchPostById);
app.post("/add-comment", post.postAddComment);
app.post("/add-like", post.postAddLike);
app.post("/unlike", post.unlikePost);
app.post("/get-posts", post.fetchAllPosts);
app.post("/get-user-upcoming-events", post.fetchUserUpcomingEvents);
app.post("/new-post-count", post.fetchLatestPostsCount);
app.post("/set-event-response", post.setEventResponse);
app.post("/new-comments", post.fetchNewCommentsByPost);

app.post("/create-group", group.createNewGroup);
// app.post("/get-new-post", post.newPostEmitEvent);

// tree routes

app.post("/add-member", tree.addMember);
app.post("/edit-member", tree.editMember);
app.post("/delete-member", tree.deleteMember);
app.post("/fetch-tree", tree.fetchTree);
app.post("/fetch-mehrams", tree.fetchMehrams);
app.post("/get-depth", tree.getDepth);

var server = app.listen(8080, function() {
  //8080 for server deployment
  console.log('running on local host port 8080');

});