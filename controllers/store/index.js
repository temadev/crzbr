'use strict';


var auth = require('../../lib/auth')
  , multipart = require('connect-multiparty')
  , multipartMiddleware = multipart()
  , async = require('async')
  , Store = require('../../models/store')
  , Card = require('../../models/card')
  , User = require('../../models/user')
  , Purchase = require('../../models/purchase');

module.exports = function (router) {

  router.get('/', auth.isAuthenticated(), function (req, res) {

    Store.find({user: req.user})
      .exec(function (err, stores) {
        if (err) {
          throw err;
        }
        res.render('store/index', { stores: stores });
      });

  });

  router.get('/create', auth.isAuthenticated(), function (req, res) {

    res.render('store/create');

  });

  router.get('/view/:id', auth.isAuthenticated(), function (req, res) {

    async.parallel({
      store: function (callback) {
        Store.findOne({_id: req.params.id})
          .exec(function (err, store) {
            if (err) {
              throw err;
            }
            callback(null, store);
          });
      },
      cards: function (callback) {
        Card.find({store: req.params.id})
          .populate('user', 'firstname lastname middlename email phone')
          .exec(function (err, cards) {
            if (err) {
              throw err;
            }
            callback(null, cards);
          });
      }
    }, function (err, results) {
      if (err) {
        console.log(err);
      }

      var allPurchases = [];
      async.each(results.cards, function (cardData, callback) {
        Purchase.find({ card: cardData })
          .populate('card', 'user')
          .exec(function (err, purchases) {
            var opts = { path: 'card.user', model: 'User', select: 'firstname lastname middlename' };
            async.each(purchases, function (purchaseData, callback) {

              Purchase.populate(purchaseData, opts, function (err, purchaseData) {
                allPurchases.push(purchaseData);
                callback();
              });
            }, function () {
              console.log(allPurchases);
              callback();
            });
          });
      }, function () {
        res.render('store/view', { store: results.store, cards: results.cards, purchases: allPurchases });
      });
    });

  });

  router.get('/edit/:id', function (req, res) {

    var id = req.params.id;

    Store.findOne({ _id: id })
      .exec(function (err, store) {
        console.log(store);
        res.render('store/edit', { store: store });
      });

  });

  router.post('/edit', function (req, res) {

    var body = req.body;

    var store = {
      title: body.title,
      description: body.description
    };

    Store.findByIdAndUpdate(body.id, { $set: store }, function (err, store) {
      res.redirect('/store/view/' + body.id);
    });

  });

  router.post('/create', auth.isAuthenticated(), multipartMiddleware, function (req, res) {

    var newStore = new Store(req.body);
    newStore.user = req.user;

    newStore.save(function (err, store) {
      res.redirect('/store/view/' + store._id);
    });

  });

  router.post('/remove', function (req, res) {

    Store.findById(req.body.id, function (err, store) {
      store.remove();
      res.send(200);
    });

  });

};