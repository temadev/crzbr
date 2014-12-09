'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , cc = require('coupon-code');

var cardModel = function () {

  var cardSchema = Schema({
    cc: String,
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    created: Date,
    updated: Date
  });

  cardSchema.pre('save', function (next) {
    var card = this;

    if (!card.created) {
      card.created = Date.now();
    }
    else {
      card.updated = Date.now();
    }

    if (!card.isModified('cc')) {
      next();
      return;
    }

    card.cc = cc.generate({ parts : 4 });

    //Continue with the save operation
    next();
  });

  return mongoose.model('Card', cardSchema);
};

module.exports = new cardModel();
