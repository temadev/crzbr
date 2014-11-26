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
    console.log('post-create-body', req.body);

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
            console.log('post-create-files-photo', req.files.photo);
            uploadS3(req.files.photo, user, function (url) {
              console.log('post-create-files-url', url);
              user.photo = url;
              console.log('post-create-files-user', user);
              user.save(function (err, user) {
                console.log('post-create-files-user-save', user);
                res.redirect('/user/view/' + user._id);
              });
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

  router.post('/create_lazy', auth.isAuthenticated(), function (req, res) {

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
          res.send({ id: user._id, title: user.lastname + ' ' + user.firstname, phone: user.phone });

        });

        return;
      }
      if (user) {
        res.send({ id: user._id, title: user.lastname + ' ' + user.firstname, phone: user.phone });
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
    console.log(req.body);
    body.updated = Date.now();

    if (req.files && req.files.photo) {
      User.findById(body.id, function (err, user) {
        uploadS3(req.files.photo, user, function (url) {
          body.photo = url;

          User.findByIdAndUpdate(body.id, { $set: body }, function (err, user) {
            res.redirect('/user/view/' + body.id);
          });
        });
      });
    } else {
      User.findByIdAndUpdate(body.id, { $set: body }, function (err, user) {
        res.redirect('/user/view/' + body.id);
      });
    }

  });

  router.post('/remove', function (req, res) {

    User.findById(req.body.id, function (err, user) {

      Card.find({user:user}).exec(function (err, cards) {
        async.each(cards, function (card, cb) {
          Card.findById(card._id, function (err, c) {
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
          user.remove();
          res.send(200);
        });
      });


    });

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
      console.log('upload-user', user);
      User.findById(user._id, function (err, user) {
        console.log('upload-find-user', user);
        user.photo = url;
        user.save(function (err, user) {
          console.log('upload-find-user-save', user);
          callback(user.photo);
        });
      });

    });
  }
}
