'use strict';

var auth = require('../lib/auth')
  , async = require('async')
  , Coupon = require('../models/Coupon')
  , Store = require('../models/Store')
  , Card = require('../models/Card')
  , User = require('../models/User')
  , Purchase = require('../models/Purchase');

module.exports = function (router) {

  router.get('/', function (req, res) {

    var query = {};

    if (req.user && req.user.role !== 'admin') {
      query = {user: req.user};
    }

    var allCoupons = [];

    if (req.user.role === 'user') {
      var userStores = [];
      Card.find({user: req.user._id}).exec(function (err, cards) {
        async.each(cards, function (card, cb) {
          userStores.push(card.store);
          cb();
        }, function () {
          async.each(userStores, function (store, cb) {
            Coupon
              .find({store: store})
              .populate('store', 'title image')
              .exec(function (err, coupons) {
                async.each(coupons, function (coupon, cb) {
                  allCoupons.push(coupon);
                  cb();
                }, function () {
                  cb();
                });
              });
          }, function () {
            res.render('coupon/index', {coupons: allCoupons});
          });
        });
      });
    } else {
      Store.find(query, function (err, stores) {
        async.each(stores, function (store, cb) {
          Coupon
            .find({store: store._id})
            .populate('store', 'title image')
            .exec(function (err, coupons) {
              async.each(coupons, function (coupon, cb) {
                allCoupons.push(coupon);
                cb();
              }, function () {
                cb();
              });
            });
        }, function () {
          res.render('coupon/index', {coupons: allCoupons});
        });
      });
    }

  });

  router.get('/create', auth.isAuthenticated(), function (req, res) {

    var query = {};

    if (req.user && req.user.role !== 'admin') {
      query = {user: req.user};
    }

    Store.find(query, function (err, stores) {
      res.render('coupon/create', {stores: stores});
    });

  });

  router.post('/create', auth.isAuthenticated(), function (req, res) {

    var coupon = req.body;
    coupon.date_start = formatDate(coupon.date_start);
    coupon.date_end = formatDate(coupon.date_end);

    var newCoupon = new Coupon(coupon);
    newCoupon.save();

    res.redirect('/coupon');

  });

  router.get('/view/:id', auth.isAuthenticated(), function (req, res) {

    var id = req.params.id;

    Coupon.findById(id).exec(function (err, coupon) {
      res.render('coupon/view', {coupon: coupon});
    });

  });

  router.get('/edit/:id', auth.isAuthenticated(), function (req, res) {

    var id = req.params.id;

    var query = {};

    if (req.user && req.user.role !== 'admin') {
      query = {user: req.user};
    }

    Store.find(query, function (err, stores) {
      Coupon
        .findById(id)
        .exec(function (err, coupon) {
          res.render('coupon/edit', {coupon: coupon, stores: stores});
        });
    });

  });

  router.post('/edit', auth.isAuthenticated(), function (req, res) {

    var id = req.body.id;
    var coupon = req.body;
    coupon.date_start = formatDate(coupon.date_start);
    coupon.date_end = formatDate(coupon.date_end);

    Coupon.findByIdAndUpdate(id, {$set: coupon}, function (err, coupon) {
      res.redirect('/coupon');
    });

  });

  router.post('/remove', function (req, res) {

    Coupon.findById(req.body.id, function (err, coupon) {
      if (coupon) {
        coupon.remove();
      }
      res.send(200);
    });

  });

};

function formatDate(date) {
  var d = new Date();
  if (date !== '') {
    date = date.replace(/(\d+).(\d+).(\d+)/, '$2/$1/$3');
    d.setTime(Date.parse(date));
    date = d;
  }
  return date;
}
