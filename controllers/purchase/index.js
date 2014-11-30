'use strict';


var auth = require('../../lib/auth')
  , async = require('async')
  , Store = require('../../models/store')
  , Card = require('../../models/card')
  , User = require('../../models/user')
  , Purchase = require('../../models/purchase');

module.exports = function (router) {

  router.get('/', auth.isAuthenticated(), function (req, res) {

    var dateStart = new Date()
      , dateEnd = new Date();

    dateStart.setMonth(dateStart.getMonth() - 1);

    var query = {date: {$gte: dateStart}};

    if (req.query) {
      if (req.query.dateStart && req.query.dateEnd) {
        dateStart = formatDate(req.query.dateStart);
        dateEnd = formatDate(req.query.dateEnd);
        query = {date: {$gte: dateStart, $lte: dateEnd}};
      } else {
        if (req.query.dateStart) {
          dateStart = formatDate(req.query.dateStart);
          query = {date: {$gte: dateStart}};
        }
        if (req.query.dateEnd) {
          dateEnd = formatDate(req.query.dateEnd);
          query = {date: {$lte: dateEnd}};
        }
      }
    }

    Purchase.find(query)
      .populate('card')
      .sort({created: -1})
      .exec(function (err, purchases) {
        console.log(purchases);
        var opts = {path: 'card.user', model: 'User', select: 'firstname lastname middlename'};
        var opts2 = {path: 'card.store', model: 'Store', select: 'title'};
        if (err) {
          throw err;
        }
        Purchase.populate(purchases, opts, function (err, purchases) {
          Purchase.populate(purchases, opts2, function (err, purchases) {
            res.render('purchase/index', {purchases: purchases, dateStart: dateStart, dateEnd: dateEnd});
          });
        });
      });

  });

  router.get('/create', auth.isAuthenticated(), function (req, res) {

    res.render('purchase/create');

  });

  router.post('/create', auth.isAuthenticated(), function (req, res) {

    var body = req.body
      , back = req.body.back
      , purchase = {
        card: body.card_id,
        title: body.purchase,
        date: Date.now(),
        price: body.price,
        quantity: body.quantity,
        total: parseInt(body.price) * parseInt(body.quantity)
      };

    var newPurchase = new Purchase(purchase);

    newPurchase.save(function (err, purchase) {
      if (err) {
        throw err;
      }
      if (back)
        res.redirect(back);
      else
        res.redirect('/purchase');
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
        console.log(user);
        res.render('purchase/create_user', {cards: cards, client: user});
      });

  });

  router.post('/remove', function (req, res) {

    console.log(req.body);

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
