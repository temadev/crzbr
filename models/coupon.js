'use strict';

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var coupon = function () {

  var couponSchema = Schema({
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store'
    },
    date_start: Date,
    date_end: Date,
    title: String,
    description: String,
    price: Number,
    // доступные, купленные, использованные
    status: Boolean,
    created: Date,
    updated: Date
  });

  couponSchema.pre('save', function (next) {
    var coupon = this;

    if (!coupon.created) {
      coupon.created = Date.now();
    } else {
      coupon.updated = Date.now();
    }

    next();
  });

  return mongoose.model('Coupon', couponSchema);
};

module.exports = new coupon();
