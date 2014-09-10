'use strict';


var auth = require('../../lib/auth')
  , multipart = require('connect-multiparty')
  , multipartMiddleware = multipart()
  , async = require('async')
  , Store = require('../../models/store')
  , Card = require('../../models/card')
  , User = require('../../models/user')
  , Purchase = require('../../models/purchase')
  , QRCode = require('qrcode');

module.exports = function (router) {

  router.get('/', auth.isAuthenticated(), function (req, res) {

    console.log(req.query);

    var dateStart
      , dateEnd
      , query = {};

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
        var opts = { path: 'card.user', model: 'User', select: 'firstname lastname middlename' };
        var opts2 = { path: 'card.store', model: 'Store', select: 'title' };
        if (err) {
          throw err;
        }
        Purchase.populate(purchases, opts, function (err, purchases) {
          Purchase.populate(purchases, opts2, function (err, purchases) {
            res.render('purchase/index', { purchases: purchases, dateStart: req.query.dateStart?req.query.dateStart:'', dateEnd: req.query.dateEnd?req.query.dateEnd:'' });
          });
        });
      });

  });

  router.get('/create', auth.isAuthenticated(), function (req, res) {

    Store.find({}, function (err, stores) {
      res.render('purchase/create', {stores: stores});
    });

  });

  router.post('/create', auth.isAuthenticated(), function (req, res) {

    var body = req.body
      , purchase = {
        card: body.card_id,
        title: body.purchase,
        date: Date.now(),
        price: body.price,
        quantity: body.quantity,
        total: parseInt(body.price) * parseInt(body.quantity)
      };

//    console.log(req.body);
//    console.log(purchase);

    var newPurchase = new Purchase(purchase);

    newPurchase.save(function (err, purchase) {
      if (err) {
        throw err;
      }
      res.redirect('/purchase');
    });

  });

  router.get('/create/card/:card', auth.isAuthenticated(), function (req, res) {

    var card = req.params.card;

    Store.find({}, function (err, stores) {
      Card.findById(card).populate('user', 'firstname lastname middlename phone').exec(function (err, card) {
        res.render('purchase/create_card', {stores: stores, card: card});
      });
    });

  });

  router.get('/create/user/:user', auth.isAuthenticated(), function (req, res) {

    var user = req.params.user;

    Store.find({}, function (err, stores) {
      Card.find({user: user}).populate('user', 'firstname lastname middlename phone').exec(function (err, cards) {
        res.render('purchase/create_user', {stores: stores, cards: cards});
      });
    });

  });

  router.get('/view/:id', auth.isAuthenticated(), function (req, res) {

//    async.parallel({
//      card: function (callback) {
//        Card.findOne({_id: req.params.id})
//          .populate('user store', 'title firstname lastname middlename email phone')
//          .exec(function (err, card) {
//            if (err) {
//              throw err;
//            }
//            callback(null, card);
//          });
//      },
//      purchases: function (callback) {
//        Purchase.find({card: req.params.id})
//          .exec(function (err, purchases) {
//            if (err) {
//              throw err;
//            }
//            callback(null, purchases);
//          });
//      },
//      qr: function (callback) {
//        QRCode.toDataURL('http://localhost:5000/card/view/' + req.params.id, function (err, url) {
//          if (err) {
//            throw err;
//          }
//          callback(null, url);
//        });
//      }
//    }, function (err, results) {
//      if (err) {
//        console.log(err);
//      }
//      res.render('card/view', { card: results.card, purchases: results.purchases, qr: results.qr });
//    });

  });

  router.get('/edit/:id', function (req, res) {

//    var id = req.params.id;
//
//    Card.findOne({ _id: id })
//      .exec(function (err, store) {
//        if (err) {
//          console.log(err);
//        }
//        console.log(store);
//        res.render('store/edit', { store: store });
//      });

  });


  router.post('/edit', function (req, res) {

//    var body = req.body;
//
//    var store = {
//      title: body.title,
//      description: body.description
//    };
//
//    Store.findByIdAndUpdate(body.id, { $set: store }, function (err, store) {
//      res.redirect('/store/view/' + body.id);
//    });

  });

  router.post('/create', auth.isAuthenticated(), multipartMiddleware, function (req, res) {

//    var newStore = new Store(req.body);
//    newStore.user = req.user;
//
//    newStore.save(function (err, store) {
//      res.redirect('/store/view/' + store._id);
//    });

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