'use strict';

var auth = require('../lib/auth')
  , async = require('async')
  , Store = require('../models/store')
  , Card = require('../models/card')
  , User = require('../models/user')
  , Purchase = require('../models/purchase')
  , Profile = require('../models/profile')
  , s3 = require('s3');

var easyimg = require('easyimage');

var client = s3.createClient({
  key: process.env.S3_KEY,
  secret: process.env.S3_SECRET,
  bucket: process.env.S3_BUCKET
});

module.exports = function (router) {

  router.get('/', auth.isAuthenticated(), function (req, res) {

    var query = (req.user && req.user.role !== 'admin') ? {owner: req.user} : {};

    Profile.find(query)
      .populate('user')
      .exec(function (err, users) {
        if (err) console.log(err);
        res.render('user/index', {users: users});
      });

  });

  router.get('/create', auth.isAuthenticated(), function (req, res) {

    res.render('user/create');

  });

  router.post('/create', auth.isAuthenticated(), function (req, res) {

    var client = req.body;
    if (!client.role) client.role = 'user';

    User.findOne({phone: client.phone}, function (err, user) {
      if (err) console.log(err);
      if (user) {
        Profile.findOne({user: user._id, owner: req.user._id}).exec(function (err, profile) {
          if (err) console.log(err);
          if (profile) {
            Profile.findByIdAndUpdate(profile._id, {$set: client}, function () {
              res.redirect('/user/view/' + profile._id);
            });
          } else {
            createProfile(client, user._id, req.user._id, function (profile) {
              res.redirect('/user/view/' + profile._id);
            });
          }
        });
      } else {
        var newUser = new User(client);
        newUser.save(function (err, user) {
          if (err) console.log(err);
          createProfile(client, user._id, req.user._id, function (profile) {
            imageCropUpload(req.files, user, function () {
              res.redirect('/user/view/' + profile._id);
            });
          });
        });
      }
    });

  });

  router.post('/create_lazy', auth.isAuthenticated(), function (req, res) {

    var client = req.body;
    if (!client.role) client.role = 'user';

    User.findOne({phone: client.phone}, function (err, user) {
      if (err) console.log(err);
      if (user) {
        Profile.findOne({user: user._id, owner: req.user._id}).exec(function (err, profile) {
          if (err) console.log(err);
          if (profile) {
            Profile.findByIdAndUpdate(profile._id, {$set: client}, function () {
              res.send({id: user._id, title: profile.lastname + ' ' + profile.firstname, phone: user.phone});
            });
          } else {
            createProfile(client, user._id, req.user._id, function (profile) {
              res.send({id: user._id, title: profile.lastname + ' ' + profile.firstname, phone: user.phone});
            });
          }
        });
      } else {
        var newUser = new User(client);
        newUser.save(function (err, user) {
          if (err) console.log(err);
          createProfile(client, user._id, req.user._id, function (profile) {
            res.send({id: user._id, title: profile.lastname + ' ' + profile.firstname, phone: user.phone});
          });
        });
      }
    });

  });

  router.get('/view/:id', auth.isAuthenticated(), function (req, res) {

    var id = req.params.id;

    Profile.findById(id).populate('user').exec(function (err, profile) {

      if (profile) {

        async.parallel({
          cards: function (callback) {
            Card.find({user: profile.user._id})
              .populate('store', 'title')
              .exec(function (err, card) {
                if (err) {
                  throw err;
                }
                callback(null, card);
              });
          },
          stores: function (callback) {
            Store.count({user: req.user._id})
              .exec(function (err, count) {
                callback(null, count);
              });
          }
        }, function (err, results) {
          if (err) {
            console.log(err);
          }

          var allPurchases = [];
          async.each(results.cards, function (cardData, callback) {

            Purchase.find({card: cardData})
              .populate('card', 'store')
              .exec(function (err, purchases) {
                var opts = {path: 'card.store', model: 'Store', select: 'title'};
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
            res.render('user/view', {
              client: profile,
              cards: results.cards,
              purchases: allPurchases,
              stores: results.stores
            });
          });
        });
      } else {
        res.redirect('/user');
      }

    });

  });

  router.get('/edit/:id', function (req, res) {

    var id = req.params.id;

    Profile.findById(id)
      .populate('user')
      .exec(function (err, profile) {
        res.render('user/edit', {profile: profile});
      });

  });

  router.post('/edit', function (req, res) {

    var id = req.body.profile_id
      , profile = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        middlename: req.body.middlename,
        gender: req.body.gender,
        birth: req.body.birth,
        city: req.body.city,
        updated: Date.now()
      };

    Profile.findByIdAndUpdate(id, {$set: profile}, function (err, profile) {
      User.findById(profile.user).exec(function (err, user) {
        if (user.status) {
          res.redirect('/user/view/' + id);
        } else {
          imageCropUpload(req.files, user, function () {
            res.redirect('/user/view/' + id);
          });
        }
      });
    });

  });

  router.post('/remove', function (req, res) {

    Profile.findById(req.body.id, function (err, profile) {
      Card.find({user: profile.user}).exec(function (err, cards) {
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
          profile.remove();
          res.send(200);
        });
      });
    });
  });

};

function imageCropUpload(files, user, cb) {
  if (files && files.photo && files.photo.name !== '' && (files.photo.type === 'image/jpeg' || files.photo.type === 'image/png')) {
    console.log(files);
    easyimg.rescrop({
      src: files.photo.path, dst: files.photo.path,
      width: 300, height: 300,
      cropwidth: 128, cropheight: 128,
      x: 0, y: 0,
      gravity: 'center'
    }).then(
      function (image) {
        image.name = files.photo.name;
        uploadS3(image, user._id, function () {
          cb();
        });
      },
      function (err) {
        console.log(err);
        cb();
      }
    );
  } else {
    cb();
  }
}

function uploadS3(file, user_id, cb) {
  if (file.size && file.path) {
    var uploader = client.upload(file.path, 'crzbr/' + user_id + '/' + file.name);
    uploader.on('error', function (err) {
      console.error('unable to upload:', err.stack);
    });
    uploader.on('progress', function (amountDone, amountTotal) {
      console.log('progress', amountDone, amountTotal);
    });
    uploader.on('end', function (url) {
      User.findById(user_id, function (err, user) {
        user.photo = url;
        user.save();
        if (cb) {
          cb(user.photo);
        }
      });
    });
  }
}

function createProfile(user, user_id, owner_id, cb) {
  var newProfile = new Profile({
    user: user_id,
    owner: owner_id,
    created: Date.now(),
    status: true
  });
  if (user.firstname) newProfile.firstname = user.firstname;
  if (user.lastname) newProfile.lastname = user.lastname;
  if (user.middlename) newProfile.middlename = user.middlename;
  if (user.gender) newProfile.gender = user.gender;
  if (user.city) newProfile.city = user.city;
  if (user.birth) newProfile.birth = formatDate(user.birth);
  newProfile.save(function (err, profile) {
    if (cb) cb(profile);
  });
}

function formatDate(date) {
  var d = new Date();
  if (date !== '') {
    date = date.replace(/(\d+).(\d+).(\d+)/, '$2/$1/$3');
    d.setTime(Date.parse(date));
    date = d;
  }
  return date;
}
