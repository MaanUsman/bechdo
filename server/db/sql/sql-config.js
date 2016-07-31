"use strict";
var Sequelize = require('sequelize'),
  sequelize = new Sequelize('ansab', 'root', null, {
    dialect: "mysql",
    // or 'sqlite', 'postgres', 'mariadb'
    host: 'localhost',
    port: 3306, // or 5432 (for postgres)
    logging: false
  })

sequelize
  .authenticate()
  .then(function() {
    console.log('Connection to SQL DB has been established successfully.')
  })
  .catch(function(err) {
    console.log("SOMETHING DONE GOOFED");
  })
  .done();

//USER Oject to be mapped to user table in db
var USER = sequelize.define('users', {
  user_ID: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  username: {
    type: Sequelize.STRING
  },

  phone: {
    type: Sequelize.STRING,
    unique: true
  },

  new_phone: {
    type: Sequelize.STRING,
    unique: true
  },

  profile_pic: {
    type: Sequelize.BLOB
  },

  password: Sequelize.STRING,

  new_password: Sequelize.STRING,

  gender: Sequelize.BOOLEAN,

  date_of_birth: Sequelize.DATE,

  like_counter: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },

  post_counter: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },

  comment_counter: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },

  email: Sequelize.STRING,

  location: Sequelize.STRING,

  timeline_notification: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },

  chat_notification: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },

  email_notification: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },

  isAnsabTree: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },

  ejabberd_id: {
    type: Sequelize.STRING
  },

  isDeleted:{
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },

  is_alive:{
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },

  is_changing_phone:{
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'user', // this will define the table's name
  timestamps: true // this will deactivate the timestamp columns

}, {
  updatedAt: 'last_update',
  createdAt: 'date_of_creation'
});

//FAMILY Oject to be mapped to family table in db
var FAMILY = sequelize.define('family', {
  family_ID: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  family_name: {
    type: Sequelize.STRING,
    unique: true
  },

  is_ansab_tree:{
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }

}, {
  tableName: 'family', // this will define the table's name
  timestamps: true // this will deactivate the timestamp columns

}, {
  updatedAt: 'last_update',
  createdAt: 'date_of_creation'
});

//GROUP Oject to be mapped to group table in db
var GROUP = sequelize.define('group', {
  group_ID: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  group_pic: {
    type: Sequelize.STRING
  },

  group_name: {
    type: Sequelize.STRING
  },

  jid: {
    type: Sequelize.STRING
  }

}, {
  tableName: 'group', // this will define the table's name
  timestamps: true // this will deactivate the timestamp columns

}, {
  updatedAt: 'last_update',
  createdAt: 'date_of_creation'
});

//GROUP Oject to be mapped to group table in db
var REF_USER_TYPE = sequelize.define('user_type', {
  type_ID: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  type_name: {
    type: Sequelize.STRING
  }

}, {
  tableName: 'user_type', // this will define the table's name
  timestamps: false // this will deactivate the timestamp columns
});

//CONTACT Oject to be mapped to contact table in db
var CONTACT = sequelize.define('contact', {
  contact_ID: {
    type: Sequelize.INTEGER,
    primaryKey: true
  },
  user_ID: {
    type: Sequelize.INTEGER,
    primaryKey: true
  }

}, {
  tableName: 'contact', // this will define the table's name
  timestamps: false // this will deactivate the timestamp columns
});

//GROUP Oject to be mapped to group table in db
var USER_SESSION = sequelize.define('user_session', {
  session_id: {
    type: Sequelize.STRING,
  },

  is_active: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }

}, {
  tableName: 'user_session', // this will define the table's name
  timestamps: true // this will deactivate the timestamp columns

}, {
  updatedAt: 'last_update',
  createdAt: 'date_of_creation'
});

//******----------RELATIONS START---------*****

USER.belongsToMany(USER, {
  through: 'contact',
  foreignKey: 'user_ID',
  as: 'owner'
});

USER.belongsToMany(USER, {
  through: 'contact',
  foreignKey: 'contact_ID',
  as: 'contact'
});


//User belongs tyo user type
USER.belongsTo(REF_USER_TYPE, {
  foreignKey: 'userType_ID'
});

//User belongTo family. will add faimily_ID foreign key to USER table.
USER.belongsTo(FAMILY, {
  onDelete: 'cascade',
  foreignKey: 'family_ID'
});

//USER can belongsTo many GROUP through user_group middle table.
USER.belongsToMany(GROUP, {
  onDelete: 'cascade',
  through: 'user_group'
});

//GROUP can have many USER through user_group middle table.
GROUP.belongsToMany(USER, {
  onDelete: 'cascade',
  through: 'user_group'
});

//User has one session.
USER_SESSION.belongsTo(USER, {
  foreignKey: "user_id"
});

USER.hasOne(USER_SESSION, {
  foreignKey: "user_id"
});
sequelize
  .sync({
    force: false
  })
  .then(function() {
    console.log('It worked fine!')
  })
  .catch(function(err) {
    console.log("Error in syncing", err);
  })
  .done();

exports.userModel = USER;
exports.familyModel = FAMILY;
exports.groupModel = GROUP;
exports.contactModel = CONTACT;
exports.userSession = USER_SESSION;

exports.sequelize = sequelize;