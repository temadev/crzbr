'use strict';


var auth = require('../lib/auth')
  , multipart = require('connect-multiparty')
  , multipartMiddleware = multipart()
  , async = require('async')
  , Store = require('../models/store')
  , Card = require('../models/card')
  , User = require('../models/user')
  , Purchase = require('../models/purchase')
  , QRCode = require('qrcode')
  , cc = require('coupon-code')
  , PDFDocument = require('pdfkit')
  , path = require('path')
  , request = require('request')
  , fs = require('fs');

module.exports = function (router) {

  router.get('/', auth.isAuthenticated(), function (req, res) {

    var query = {};

    if (req.user && req.user.role !== 'admin') {
      query = {user: req.user};
    }

    var allCards = [];

    if (req.user.role === 'user') {
      Card.find({user: req.user._id})
        .populate('user store', 'firstname lastname middlename email phone title')
        .exec(function (err, cards) {
          if (err) {
            throw err;
          }
          async.each(cards, function (cardData, callback) {
            Purchase.count({card: cardData})
              .exec(function (err, purchases) {
                cardData.purchases = purchases;
                allCards.push(cardData);
                callback();
              });
          }, function () {
            res.render('card/index', {cards: allCards});
          });
        });
    } else {
      Store.find(query)
        .exec(function (err, stores) {
          if (err) {
            throw err;
          }

          async.each(stores, function (store, cb) {
            Card.find({store: store})
              .populate('user store', 'firstname lastname middlename email phone title')
              .exec(function (err, cards) {
                if (err) {
                  throw err;
                }
                async.each(cards, function (cardData, callback) {
                  Purchase.count({card: cardData})
                    .exec(function (err, purchases) {
                      cardData.purchases = purchases;
                      allCards.push(cardData);
                      callback();
                    });
                }, function () {
                  cb();
                });

              });
          }, function () {
            res.render('card/index', {cards: allCards});
          });
        });
    }

  });

  router.get('/create', auth.isAuthenticated(), function (req, res) {

    var query = {};

    if (req.user && req.user.role !== 'admin') {
      query = {user: req.user};
    }

    Store.find(query, function (err, stores) {
      res.render('card/create', {stores: stores});
    });

  });

  router.post('/create', auth.isAuthenticated(), multipartMiddleware, function (req, res) {

    var count = req.body.count
      , user = req.body.user_id;

    if (!count) {
      count = 1;
    }

    for (var i = 0; i < count; i++) {
      var newCard = new Card({
        user: user ? user : null,
        store: req.body.store,
        cc: cc.generate({parts: 4}),
        author: req.user._id
      });

      newCard.save();

      if (count - i === 1) {
        res.redirect('/card/');
      }
    }

  });

  router.get('/create/:user', auth.isAuthenticated(), function (req, res) {

    var user = req.params.user
      , query = {};

    if (req.user && req.user.role !== 'admin') {
      query = {user: req.user};
    }

    Store.find(query, function (err, stores) {
      res.render('card/user', {stores: stores, user_id: user});
    });

  });

  router.get('/view/:id', auth.isAuthenticated(), function (req, res) {

    async.parallel({
      card: function (callback) {
        Card.findOne({_id: req.params.id})
          .populate('user store', 'title firstname lastname middlename email phone')
          .exec(function (err, card) {
            if (err) {
              throw err;
            }
            callback(null, card);
          });
      },
      purchases: function (callback) {
        Purchase.find({card: req.params.id})
          .exec(function (err, purchases) {
            if (err) {
              throw err;
            }
            callback(null, purchases);
          });
      },
      qr: function (callback) {
        QRCode.toDataURL('http://localhost:5000/card/view/' + req.params.id, function (err, url) {
          if (err) {
            throw err;
          }
          callback(null, url);
        });
      }
    }, function (err, results) {
      if (err) {
        console.log(err);
      }
      res.render('card/view', {card: results.card, purchases: results.purchases, qr: results.qr});
    });

  });

  router.get('/view/:id/print', auth.isAuthenticated(), function (req, res) {

    var id = req.params.id;

    drawCard(id, function (string) {
      res.contentType = 'application/pdf';
      res.end(string);
    });

  });

  router.post('/printSelected', auth.isAuthenticated(), function (req, res) {

    drawCard(req.body.print, function (string) {
      res.contentType = 'application/pdf';
      res.end(string);
    });

  });

  router.get('/edit/:id', function (req, res) {

    var id = req.params.id;

    Card.findOne({_id: id})
      .exec(function (err, card) {
        if (err) {
          console.log(err);
        }
        res.render('card/edit', {card: card});
      });

  });


  router.post('/edit', function (req, res) {

    var body = req.body;

    var card = {};

    if (body.user_id) {
      User.findById(body.user_id).exec(function (err, user) {
        card.user = user._id;
        Card.findByIdAndUpdate(body.id, {$set: card}, function (err, card) {
          res.redirect('/card/view/' + body.id);
        });
      });
    } else {
      res.redirect('/card/view/' + body.id);
    }

  });

  router.post('/remove', function (req, res) {

    Card.findById(req.body.id, function (err, card) {
      Purchase.find({card: card._id}, function (err, purchases) {
        async.each(purchases, function (purchase, cb) {
          Purchase.findByIdAndRemove(purchase._id, function () {
            cb();
          });
        }, function () {
          card.remove();
          res.send(200);
        });
      });
    });

  });

};

function drawCard(id, cb) {

  var cards;

  if (typeof id === 'string') {
    cards = [id];
  } else {
    cards = id;
  }

  var doc = new PDFDocument({size: 'A4', margins: {top: 5, bottom: 5, left: 5, right: 5}});

  var i = 0
    , row = 0
    , top = 0
    , qr_top = 65
    , img_top = 76
    , text1_top = 10
    , text2_top = 20
    , text1_left
    , text2_left
    , qr_left
    , img_left
    , left
    , right = 262
    , bottom = 163;

  async.eachSeries(cards, function (card, cb) {

    async.parallel({
      card: function (callback) {
        Card.findOne({_id: card})
          .populate('user store', 'title firstname lastname middlename email phone image')
          .exec(function (err, card) {
            callback(null, card);
          });
      },
      qr: function (callback) {
        QRCode.save(path.join(__dirname, '../../../tmp/' + card + '.png'), 'http://yarkosa.crazybuyer.ru/card/view/' + card, function (err, url) {
          callback(null, url);
        });
      }
    }, function (err, results) {

      if (i !== 0 && i % 10 === 0) {
        doc.addPage();
        row = 0;
        top = 0;
        qr_top = 65;
        img_top = 76;
        text1_top = 10;
        text2_top = 20;
      }

      if (row > 0) {
        top = 163 * row;
        text1_top = 10 + 163 * row;
        text2_top = 20 + 163 * row;
        qr_top = 65 + 163 * row;
        img_top = 76 + 163 * row;
      }

      if (i % 2 === 1) {
        text1_left = 10 + 262;
        text2_left = 10 + 262;
        qr_left = 162 + 262;
        img_left = 7 + 262;
        left = 262;
        row++;
      } else {
        text1_left = 10;
        text2_left = 10;
        qr_left = 162;
        img_left = 7;
        left = 0;
      }


      doc.font(path.join(__dirname, '../../public/fonts/RobotoCondensed-Regular.ttf'));
      doc.fontSize(9).fillColor('black').text(results.card.cc, text1_left, text1_top);
      doc.fontSize(14).fillColor('black').text(results.card.store.title, text2_left, text2_top);
      doc.image(path.join(__dirname, '../../../tmp/' + card + '.png'), qr_left, qr_top, {fit: [100, 100]});
      doc.lineJoin('miter').rect(left, top, right, bottom).stroke();

      if (results.card.store.image) {
        var image = results.card.store.image.split('/')
          , len = image.length;

        var createImage = request(results.card.store.image).pipe(fs.createWriteStream(path.join(__dirname, '../../../tmp/' + image[len] + card)));
        createImage.on('finish', function () {
          doc.image(path.join(__dirname, '../../../tmp/' + image[len] + card), img_left, img_top, {fit: [80, 80]});
          i++;
          cb();
        });
      } else {
        i++;
        cb();
      }

    });

  }, function () {
    doc.output(function (string) {
      cb(string);
    });
  });

}
