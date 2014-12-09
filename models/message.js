'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var message = function () {

  var messageSchema = Schema({
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store'
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    date: Date,
    message: String,
    status: Boolean,
    created: Date,
    updated: Date
  });

  messageSchema.pre('save', function (next) {
    var message = this;

    if (!message.created) {
      message.created = Date.now();
    } else {
      message.updated = Date.now();
    }

    next();
  });

  return mongoose.model('Message', messageSchema);
};

module.exports = new message();
