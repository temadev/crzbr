'use strict';


var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , bcrypt = require('bcrypt')
  , crypto = require('../lib/crypto');

var userModel = function () {

  var userSchema = Schema({
    firstname: String,
    lastname: String,
    middlename: String,
    phone: String,
    username: String,
    email: String,
    password: String,
    role: String,
    post: String,
    photo: String,
    gender: String,
    birth: Date,
    city: String,
    created: Date,
    updated: Date,
    status: Boolean
  });


  userSchema.pre('save', function (next) {
    var user = this;

    if (!user.created) {
      user.created = Date.now();
    }
    user.updated = Date.now();

    if (!user.isModified('password')) {
      next();
      return;
    }

    user.password = bcrypt.hashSync(user.password, crypto.getCryptLevel());

    next();
  });

  userSchema.methods.passwordMatches = function (plainText) {
    var user = this;
    return bcrypt.compareSync(plainText, user.password);
  };

  return mongoose.model('User', userSchema);
};

module.exports = new userModel();
