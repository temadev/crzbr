'use strict';


var auth = require('../lib/auth')
  , async = require('async')
  , Price = require('../models/Price')
  , Card = require('../models/Card')
  , User = require('../models/User')
  , Store = require('../models/Store')
  , Purchase = require('../models/Purchase');

module.exports = function (router) {

  router.get('/', auth.isAuthenticated(), function (req, res) {

    var query = {};

    if (req.user && req.user.role !== 'admin') {
      query = {user: req.user};
    }

    Store.find(query, function (err, stores) {
      if (stores.length === 1)
        res.redirect('/price/' + stores[0]._id);
      else
        res.render('price/select', { stores: stores });
    });

  });

  router.get('/:store', auth.isAuthenticated(), function (req, res) {

    var allPrices = [];

    async.parallel([
      function (cb) {
        Store.findById(req.params.store).exec(function (err, store) {
          cb(null, store);
        });
      },
      function (cb) {
        Price.find({store: req.params.store})
          .populate('store', 'title')
          .exec(function (err, prices) {
            async.each(prices, function (price, cb) {
              allPrices.push(price);
              cb();
            }, function () {
              cb();
            });
          });
      }
    ], function (err, results) {
      console.log(arguments);
      res.render('price/index', { prices: allPrices, store: results[0] });
    });

  });

  router.get('/create', auth.isAuthenticated(), function (req, res) {

    var query = {};

    if (req.user && req.user.role !== 'admin') {
      query = {user: req.user};
    }

    Store.find(query, function (err, stores) {
      res.render('price/create', {stores: stores});
    });

  });

  router.get('/create/:store', auth.isAuthenticated(), function (req, res) {

    if (req.params.store) {
      res.render('price/create', {store: req.params.store});
    } else {
      var query = {};

      if (req.user && req.user.role !== 'admin') {
        query = {user: req.user};
      }
      Store.find(query, function (err, stores) {
        res.render('price/create', {stores: stores});
      });
    }


  });

  router.post('/create', auth.isAuthenticated(), function (req, res) {

    var newPrice = new Price(req.body);

    newPrice.author = req.user._id;

    newPrice.save(function (err, price) {
      res.redirect('/price/view/' + price._id);
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

    var id = req.params.id
      , query = {};

    if (req.user && req.user.role !== 'admin') {
      query = {user: req.user};
    }

    Price.findById(id)
      .exec(function (err, price) {
        Store.find(query, function (err, stores) {
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

  router.post('/remove', function (req, res) {

    Price.findById(req.body.id, function (err, price) {
      if (price) {
        price.remove();
      }
      res.send(200);
    });

  });

};
