'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var news = function () {

  var newsSchema = Schema({
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store'
    },
    date: Date,
    title: String,
    description: String,
    status: Boolean,
    created: Date,
    updated: Date
  });

  newsSchema.pre('save', function (next) {
    var news = this;

    if (!news.created) {
      news.created = Date.now();
    } else {
      news.updated = Date.now();
    }

    next();
  });

  return mongoose.model('News', newsSchema);
};

module.exports = new news();
