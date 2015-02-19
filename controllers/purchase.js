'use strict';


var auth = require('../lib/auth')
  , async = require('async')
  , Store = require('../models/store')
  , Card = require('../models/card')
  , User = require('../models/user')
  , Purchase = require('../models/purchase');

module.exports = function (router) {

  router.get('/', auth.isAuthenticated(), function (req, res) {

    var dateStart = new Date()
      , dateEnd = new Date();

    dateStart.setMonth(dateStart.getMonth() - 1);

    var filter = {date: {$gte: dateStart}};

    if (req.query) {
      if (req.query.dateStart && req.query.dateEnd) {
        dateStart = formatDate(req.query.dateStart);
        dateEnd = formatDate(req.query.dateEnd);
        filter = {date: {$gte: dateStart, $lte: dateEnd}};
      } else {
        if (req.query.dateStart) {
          dateStart = formatDate(req.query.dateStart);
          filter = {date: {$gte: dateStart}};
        }
        if (req.query.dateEnd) {
          dateEnd = formatDate(req.query.dateEnd);
          filter = {date: {$lte: dateEnd}};
        }
      }
    }

    var allPurchases = [];

    if (req.user.role === 'user') {
      Card.find({user: req.user._id}).exec(function (err, cards) {
        async.each(cards, function (card, cb) {
          filter.card = card;
          Purchase.find(filter)
            .populate('card')
            .populate('store')
            .sort({created: -1})
            .exec(function (err, purchases) {
              var opts = {path: 'card.user', model: 'User', select: 'firstname lastname middlename'};
              Purchase.populate(purchases, opts, function (err, purchases) {
                async.each(purchases, function (purchase, cb) {
                  allPurchases.push(purchase);
                  cb();
                }, function () {
                  cb();
                });
              });
            });
        }, function () {
          res.render('purchase/index', {purchases: allPurchases, dateStart: dateStart, dateEnd: dateEnd});
        });
      });
    } else {
      Store.find({user: req.user._id}).exec(function (err, stores) {

        async.each(stores, function (store, cb) {
          filter.store = store._id;
          Purchase.find(filter)
            .populate('card')
            .populate('store')
            .sort({created: -1})
            .exec(function (err, purchases) {
              var opts = {path: 'card.user', model: 'User', select: 'firstname lastname middlename'};
              Purchase.populate(purchases, opts, function (err, purchases) {
                async.each(purchases, function (purchase, cb) {
                  allPurchases.push(purchase);
                  cb();
                }, function () {
                  cb();
                });
              });
            });
        }, function () {
          res.render('purchase/index', {purchases: allPurchases, dateStart: dateStart, dateEnd: dateEnd});
        });

      });
    }

  });

  router.get('/create', auth.isAuthenticated(), function (req, res) {

    res.render('purchase/create');

  });

  router.post('/create', auth.isAuthenticated(), function (req, res) {

    var body = req.body
      , back = req.body.back
      , purchase = {
        title: body.purchase,
        date: Date.now(),
        price: body.price,
        quantity: body.quantity,
        total: parseInt(body.price) * parseInt(body.quantity)
      };

    Card.findById(body.card_id).exec(function (err, card) {
      purchase.card = card._id;
      purchase.store = card.store;

      var newPurchase = new Purchase(purchase);
      newPurchase.save(function (err, purchase) {
        if (back) {
          res.redirect(back);
        }
        else {

          res.redirect('/purchase');
        }
      });
    });

  });

  router.get('/create/card/:card', auth.isAuthenticated(), function (req, res) {

    var card = req.params.card;

    Card
      .findById(card)
      .populate('user', 'firstname lastname middlename phone')
      .populate('store', 'title')
      .exec(function (err, card) {
        res.render('purchase/create_card', {card: card});
      });

  });

  router.get('/create/user/:user', auth.isAuthenticated(), function (req, res) {

    var user = req.params.user;

    Card
      .find({user: user})
      .populate('user', 'firstname lastname middlename phone')
      .populate('store', 'title')
      .exec(function (err, cards) {
        res.render('purchase/create_user', {cards: cards, client: user});
      });

  });

  router.get('/view/:id', auth.isAuthenticated(), function (req, res) {
    var id = req.params.id;
    Purchase.findById(id).exec(function (err, purchase) {
      Card
        .findById(purchase.card)
        .populate('store user', 'title lastname firstname middlename')
        .exec(function (err, card) {
          res.render('purchase/view', {purchase: purchase, card: card});
        });
    });
  });

  router.get('/edit/:id', auth.isAuthenticated(), function (req, res) {
    var id = req.params.id;
    Purchase.findById(id).exec(function (err, purchase) {
      res.render('purchase/edit', {purchase: purchase});
    });
  });

  router.post('/edit', auth.isAuthenticated(), function (req, res) {

    var id = req.body.id
      , purchase = {
        title: req.body.title,
        price: req.body.price,
        quantity: req.body.quantity,
        total: req.body.total
      };

    Purchase.findByIdAndUpdate(id, {$set: purchase}, function (err, purchase) {
      res.redirect('/purchase/view/' + id);
    });

  });

  router.post('/remove', function (req, res) {

    Purchase.findById(req.body.id, function (err, purchase) {
      if (purchase) {
        purchase.remove();
      }
      res.send(200);
    });

  });

};

function formatDate(date) {
  var d = new Date();
  date = date.replace(/(\d+).(\d+).(\d+)/, '$2/$1/$3');
  d.setTime(Date.parse(date));
  date = d;
  return date;
}
