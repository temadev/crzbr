'use strict';


var auth = require('../../lib/auth')
  , multipart = require('connect-multiparty')
  , multipartMiddleware = multipart()
  , async = require('async')
  , Store = require('../../models/store')
  , Card = require('../../models/card')
  , User = require('../../models/user')
  , Purchase = require('../../models/purchase')
  , QRCode = require('qrcode')
  , s3 = require('s3');

var client = s3.createClient({
  key: 'AKIAIIPJP7GV7ZQLR7GA',
  secret: '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',
  bucket: 'roskonkurs'
});

module.exports = function (router) {

  router.get('/', auth.isAuthenticated(), function (req, res) {

    User.find({})
      .exec(function (err, users) {
        if (err) {
          throw err;
        }
        res.render('user/index', { users: users });
      });

  });

  router.get('/create', auth.isAuthenticated(), function (req, res) {

    res.render('user/create');

  });

  router.post('/create', auth.isAuthenticated(), function (req, res) {

    var body = req.body;

    User.findOne({email: body.email}, function (err, user) {
      if (err) {
        throw err;
      }
      console.log(user);
      if (!user) {
        var newUser = new User(body);
        newUser.created = Date.now();
        newUser.save(function (err, user) {
          if (err) {
            throw err;
          }
          if (req.files && req.files.photo) {
            uploadS3(req.files.photo, user, function (url) {
              res.redirect('/user/view/' + user._id);
            });
          } else {
            res.redirect('/user/view/' + user._id);
          }

        });

        return;
      }
      if (user) {
        res.redirect('/user/view/' + user._id);
      }
    });

  });

  router.get('/view/:id', auth.isAuthenticated(), function (req, res) {

    var id = req.params.id;

    async.parallel({
      user: function (callback) {
        User.findById(id, function (err, user) {
          if (err) {
            throw err;
          }
          callback(null, user);
        });
      },
      cards: function (callback) {
        Card.find({user: id})
          .populate('store', 'title')
          .exec(function (err, card) {
            if (err) {
              throw err;
            }
            callback(null, card);
          });
      }
    }, function (err, results) {
      if (err) {
        console.log(err);
      }

      var allPurchases = [];
      async.each(results.cards, function (cardData, callback) {

        Purchase.find({ card: cardData })
          .populate('card', 'store')
          .exec(function (err, purchases) {
            var opts = { path: 'card.store', model: 'Store', select: 'title' };
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
        console.log(results.user);
        res.render('user/view', { client: results.user, cards: results.cards, purchases: allPurchases });
      });
    });

  });

  router.get('/edit/:id', function (req, res) {

    var id = req.params.id;

    User.findOne({ _id: id })
      .exec(function (err, user) {
        console.log(user);
        res.render('user/edit', { client: user });
      });

  });

  router.post('/edit', function (req, res) {

    var body = req.body;
//    console.log(req);
    body.updated = Date.now();

    if (req.files && req.files.photo) {
      uploadS3(req.files.photo, req.user, function (url) {
        body.photo = url;

        User.findByIdAndUpdate(body.id, { $set: body }, function (err, user) {
          res.redirect('/user/view/' + body.id);
        });
      });
    } else {
      User.findByIdAndUpdate(body.id, { $set: body }, function (err, user) {
        res.redirect('/user/view/' + body.id);
      });
    }

  });

};

function uploadS3(file, user, callback) {
  if (file.path) {
    var uploader = client.upload(file.path, 'crzbr/' + user._id + '/' + file.name);
    uploader.on('error', function (err) {
      console.error('unable to upload:', err.stack);
    });
    uploader.on('progress', function (amountDone, amountTotal) {
      console.log('progress', amountDone, amountTotal);
    });
    uploader.on('end', function (url) {
      console.log('file available at', url);
      User.findByIdAndUpdate(user._id, { $set: {photo: url} }, function (err, user) {
        callback(user.photo);
      });

    });
  }
}