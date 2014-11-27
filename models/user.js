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
    email: { type: String, unique: true },
    password: String,
    role: String,
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    post: String,
    photo: String,
    created: Date,
    updated: Date,
    status: Boolean
  });

  /**
   * Helper function that hooks into the 'save' method, and replaces plaintext passwords with a hashed version.
   */
  userSchema.pre('save', function (next) {
    var user = this;

    if (!user.created) {
      user.created = Date.now();
    }
    user.updated = Date.now();

    //If the password has not been modified in this save operation, leave it alone (So we don't double hash it)
    if (!user.isModified('password')) {
      next();
      return;
    }

    user.password = bcrypt.hashSync(user.password, crypto.getCryptLevel());

//    console.log(user);
    //Continue with the save operation
    next();
  });

  /**
   * Helper function that takes a plaintext password and compares it against the user's hashed password.
   * @param plainText
   * @returns true/false
   */
  userSchema.methods.passwordMatches = function (plainText) {
    var user = this;
    return bcrypt.compareSync(plainText, user.password);
  };


  return mongoose.model('User', userSchema);
};

module.exports = new userModel();
