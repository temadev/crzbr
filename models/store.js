'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var storeModel = function () {

  var storeSchema = Schema({
    title: String,
    description: String,
    image: String,
    status: Boolean,
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    created: Date,
    updated: Date
  });

  storeSchema.pre('save', function (next) {
    var store = this;

    if (!store.created) {
      store.created = Date.now();
    }
    else {
      store.updated = Date.now();
    }

    //Continue with the save operation
    next();
  });

  return mongoose.model('Store', storeSchema);
};

module.exports = new storeModel();
