'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var priceModel = function () {

  var priceSchema = Schema({
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true
    },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    title: String,
    description: String,
    price: Number,
    status: Boolean
  });

  return mongoose.model('Price', priceSchema);
};

module.exports = new priceModel();
