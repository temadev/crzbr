'use strict';

var auth = require('../lib/auth')
  , async = require('async')
  , Store = require('../models/store')
  , Card = require('../models/card')
  , User = require('../models/user')
  , Purchase = require('../models/purchase')
  , Price = require('../models/price')
  , s3 = require('s3');

var easyimg = require('easyimage');

var client = s3.createClient({
  key: process.env.S3_KEY,
  secret: process.env.S3_SECRET,
  bucket: process.env.S3_BUCKET
});

module.exports = function (router) {

  router.get('/', auth.isAuthenticated(), function (req, res) {

    var query = {};

    if (req.user && req.user.role !== 'admin') {
      query = {user: req.user};
    }

    Store.find(query)
      .populate('user')
      .exec(function (err, stores) {
        if (err) {
          throw err;
        }
        res.render('store/index', {stores: stores});
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
        Purchase.find({card: cardData})
          .populate('card', 'user')
          .exec(function (err, purchases) {
            var opts = {path: 'card.user', model: 'User', select: 'firstname lastname middlename'};
            async.each(purchases, function (purchaseData, callback) {

              Purchase.populate(purchaseData, opts, function (err, purchaseData) {
                allPurchases.push(purchaseData);
                callback();
              });
            }, function () {
              callback();
            });
          });
      }, function () {
        res.render('store/view', {store: results.store, cards: results.cards, purchases: allPurchases});
      });
    });

  });

  router.get('/edit/:id', function (req, res) {

    var id = req.params.id
      , query = {_id: id};

    if (req.user && req.user.role !== 'admin') {
      query = {_id: id, user: req.user._id};
    }

    Store.findOne(query)
      .exec(function (err, store) {
        if (store) {
          res.render('store/edit', {store: store});
        }
        else {
          res.redirect('/store');
        }
      });

  });

  router.post('/edit', auth.isAuthenticated(), function (req, res) {

    var body = req.body;

    var store = {
      title: body.title,
      description: body.description
    };

    Store.findByIdAndUpdate(body.id, {$set: store}, function (err, store) {
      console.log(req.files);
      if (req.files && req.files.image && req.files.image.name !== '' && (req.files.image.type === 'image/jpeg' || req.files.image.type === 'image/png')) {
        easyimg.rescrop({
          src: req.files.image.path, dst: req.files.image.path,
          width: 300, height: 300,
          cropwidth: 128, cropheight: 128,
          x: 0, y: 0,
          gravity: 'center'
        }).then(
          function (image) {
            image.name = req.files.image.name;
            uploadS3(image, store, function (url) {
              res.redirect('/store/view/' + store._id);
            });
          },
          function (err) {
            res.redirect('/store/view/' + store._id);
          }
        );

      } else {
        res.redirect('/store/view/' + store._id);
      }
    });

  });

  router.post('/create', auth.isAuthenticated(), function (req, res) {

    var newStore = new Store(req.body);
    newStore.user = req.user;

    newStore.save(function (err, store) {
      if (req.files && req.files.image && req.files.image.name !== '' && (req.files.image.type === 'image/jpeg' || req.files.image.type === 'image/png')) {
        easyimg.rescrop({
          src: req.files.image.path, dst: req.files.image.path,
          width: 300, height: 300,
          cropwidth: 128, cropheight: 128,
          x: 0, y: 0,
          gravity: 'center'
        }).then(
          function (image) {
            image.name = req.files.image.name;
            uploadS3(image, store, function (url) {
              res.redirect('/store/view/' + store._id);
            });
          },
          function (err) {
            res.redirect('/store/view/' + store._id);
          }
        );
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
      //console.log('progress', amountDone, amountTotal);
    });
    uploader.on('end', function (url) {
      Store.findByIdAndUpdate(store._id, {$set: {image: url}}, function (err, store) {
        callback(store.image);
      });
    });
  }
}
