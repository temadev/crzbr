'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var purchase = function () {

  var purchaseSchema = Schema({
    card: {
      type: Schema.Types.ObjectId,
      ref: 'Card',
      required: true
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store'
    },
    title: String,
    date: { type: Date },
    price: Number,
    quantity: Number,
    total: Number,
    status: Boolean,
    created: Date,
    updated: Date
  });

  purchaseSchema.pre('save', function (next) {
    var purchase = this;

    if (!purchase.created) {
      purchase.created = Date.now();
    }
    else {
      purchase.updated = Date.now();
    }

    //Continue with the save operation
    next();
  });

  return mongoose.model('Purchase', purchaseSchema);
};

module.exports = new purchase();
