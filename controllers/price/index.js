'use strict';


var auth = require('../../lib/auth')
  , async = require('async')
  , Price = require('../../models/price')
  , Card = require('../../models/card')
  , User = require('../../models/user')
  , Store = require('../../models/store')
  , Purchase = require('../../models/purchase');

module.exports = function (router) {

  router.get('/', auth.isAuthenticated(), function (req, res) {

    Price.find({})
      .populate('store', 'title')
      .exec(function (err, prices) {
        if (err) {
          throw err;
        }
        res.render('price/index', { prices: prices });
      });

  });

  router.get('/create', auth.isAuthenticated(), function (req, res) {

    Store.find({}, function (err, stores) {
      res.render('price/create', {stores: stores});
    });

  });

  router.post('/create', auth.isAuthenticated(), function (req, res) {

    var newPrice = new Price(req.body);

    newPrice.save(function (err, price) {
      res.redirect('/price/view/' + price._id)
    });

  });

  router.get('/view/:id', auth.isAuthenticated(), function (req, res) {

    var id = req.params.id;

    Price.findById(id)
      .populate('store', 'title')
      .exec(function (err, price) {
        res.render('price/view', { price: price });
      });

  });

  router.get('/edit/:id', auth.isAuthenticated(), function (req, res) {

    var id = req.params.id;

    Price.findById(id)
      .exec(function (err, price) {
        Store.find({}, function (err, stores) {
          res.render('price/edit', { price: price, stores: stores });
        });

      });

  });

  router.post('/edit', auth.isAuthenticated(), function (req, res) {

    var body = req.body;

    Price.findByIdAndUpdate(body.id, { $set: body }, function (err, price) {
      res.redirect('/price/view/' + body.id);
    });

  });

};