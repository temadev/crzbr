'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var profile = function () {

  var profileSchema = Schema({
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    firstname: String,
    lastname: String,
    middlename: String,
    gender: String,
    birth: Date,
    city: String,
    created: Date,
    updated: Date,
    status: Boolean
  });

  profileSchema.pre('save', function (next) {
    var profile = this;

    if (!profile.created) {
      profile.created = Date.now();
    } else {
      profile.updated = Date.now();
    }

    //Continue with the save operation
    next();
  });

  return mongoose.model('Profile', profileSchema);
};

module.exports = new profile();
