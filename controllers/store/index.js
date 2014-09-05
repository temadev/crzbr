'use strict';


var auth = require('../../lib/auth')
  , multipart = require('connect-multiparty')
  , multipartMiddleware = multipart()
  , async = require('async')
  , Store = require('../../models/store')
  , Card = require('../../models/card')
  , User = require('../../models/user')
  , Purchase = require('../../models/purchase')
  , Price = require('../../models/price')
  , s3 = require('s3');

var client = s3.createClient({
  key: 'AKIAIIPJP7GV7ZQLR7GA',
  secret: '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',
  bucket: 'roskonkurs'
});

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

  router.post('/edit', auth.isAuthenticated(), function (req, res) {

    var body = req.body;

    var store = {
      title: body.title,
      description: body.description
    };
    console.log(req.body);
    console.log(req.files);

    Store.findByIdAndUpdate(body.id, { $set: store }, function (err, store) {
      console.log(req.files);
      if (req.files && req.files.image) {
        uploadS3(req.files.image, store, function (url) {
          console.log(url);
          res.redirect('/store/view/' + store._id);
        });
      } else {
        res.redirect('/store/view/' + store._id);
      }
    });

  });

  router.post('/create', auth.isAuthenticated(), function (req, res) {

    var newStore = new Store(req.body);
    newStore.user = req.user;

    newStore.save(function (err, store) {
      if (req.files && req.files.photo) {
        uploadS3(req.files.photo, store, function (url) {
          res.redirect('/store/view/' + store._id);
        });
      } else {
        res.redirect('/store/view/' + store._id);
      }

    });

  });

  router.post('/remove', function (req, res) {

    Store.findById(req.body.id, function (err, store) {
      async.parallel({
        cards: function (callback) {
          Card.find({store: store}).exec(function (err, cards) {
            async.each(cards, function (card, cb) {
              Card.findById(card._id).exec(function (err, c) {
                Purchase.find({card: c}).exec(function (err, purchases) {
                  async.each(purchases, function (purchase, cb) {
                    Purchase.findById(purchase._id).exec(function (err, p) {
                      p.remove();
                      cb();
                    });
                  });
                });
                c.remove();
                cb();
              });
            }, function () {
              callback();
            });
          });
        },
        price: function (callback) {
          Price.find({store: store}).exec(function (err, prices) {
            async.each(prices, function (price, cb) {
              Price.findById(price._id, function (err, p) {
                p.remove();
                cb();
              });
            }, function () {
              callback();
            });
          });
        }
      }, function () {
        store.remove();
        res.send(200);
      });

    });

  });

};

function uploadS3(file, store, callback) {
  if (file.path) {
    var uploader = client.upload(file.path, 'crzbr/stores/' + store._id + '/' + file.name);
    uploader.on('error', function (err) {
      console.error('unable to upload:', err.stack);
    });
    uploader.on('progress', function (amountDone, amountTotal) {
      console.log('progress', amountDone, amountTotal);
    });
    uploader.on('end', function (url) {
      console.log('file available at', url);
      Store.findByIdAndUpdate(store._id, { $set: {image: url} }, function (err, store) {
        callback(store.image);
      });

    });
  }
}