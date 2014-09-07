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
  , cc = require('coupon-code')
  , PDFDocument = require('pdfkit')
  , path = require('path')
  , request = require('request')
  , fs = require('fs');

module.exports = function (router) {

  router.get('/', auth.isAuthenticated(), function (req, res) {

    Card.find({})
      .populate('user store', 'firstname lastname middlename email phone title')
      .exec(function (err, cards) {
        if (err) {
          throw err;
        }

        var allCards = [];
        async.each(cards, function (cardData, callback) {

          Purchase.count({ card: cardData })
            .exec(function (err, purchases) {
              cardData.purchases = purchases;
              allCards.push(cardData);
              callback();
            });
        }, function () {
          res.render('card/index', { cards: allCards });
        });

      });

  });

  router.get('/create', auth.isAuthenticated(), function (req, res) {

    Store.find({}, function (err, stores) {
      res.render('card/create', {stores: stores});
    });

  });

  router.post('/create', auth.isAuthenticated(), multipartMiddleware, function (req, res) {

    var newCard = new Card({
      user: req.body.user_id ? req.body.user_id : null,
      store: req.body.store,
      cc: cc.generate({ parts: 4 })
    });

    newCard.save(function (err, card) {
      if (card.user) {
        res.redirect('/card/view/' + card._id);
      } else {
        res.redirect('/card/');
      }
    });

  });

  router.get('/create/:user', auth.isAuthenticated(), function (req, res) {

    var user = req.params.user;
    console.log(user);

    Store.find({}, function (err, stores) {
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
      res.render('card/view', { card: results.card, purchases: results.purchases, qr: results.qr });
    });

  });

//  router.get('/view/:id/qr.png', function (req, res) {
//    QRCode.save(path.join(__dirname, '../../public/tmp/' + req.params.id), 'http://crzbr.herokuapp.com/card/view/' + req.params.id, function (err, url) {
//      if (err) {
//        throw err;
//      }
//
//      res.end(url);
//    });
//  });

  router.get('/view/:id/print', auth.isAuthenticated(), function (req, res) {

    async.parallel({
      card: function (callback) {
        Card.findOne({_id: req.params.id})
          .populate('user store', 'title firstname lastname middlename email phone image')
          .exec(function (err, card) {
            if (err) {
              throw err;
            }
            console.log('card', card);
            callback(null, card);
          });
      },
      qr: function (callback) {

        console.log(path.join(__dirname, '../../../tmp/' + req.params.id + '.png'));

//        QRCode.save(path.join(__dirname, '../../.build/qr/' + req.params.id + '.png'), 'http://crzbr.herokuapp.com/card/view/' + req.params.id, function (err, url) {
        QRCode.save(path.join(__dirname, '../../../tmp/' + req.params.id + '.png'), 'http://yarkosa.crazybuyer.ru/card/view/' + req.params.id, function (err, url) {
          if (err) {
            throw err;
          }
          console.log('err', err);
          console.log('url', url);
          callback(null, url);
        });
      }
    }, function (err, results) {
      if (err) {
        console.log(err);
      }

      var doc = new PDFDocument({ size: 'A4', margins: { top: 5, bottom: 5, left: 5, right: 5 } });

      doc.font(path.join(__dirname, '../../public/fonts/RobotoCondensed-Regular.ttf'));
      doc.fontSize(9).fillColor('black').text(results.card.cc);
      doc.fontSize(14).fillColor('black').text(results.card.store.title);
      doc.image(path.join(__dirname, '../../../tmp/' + req.params.id + '.png'), 162, 65, {fit: [100, 100]});
//      doc.image(path.join(__dirname, '../../.build/qr/' + req.params.id + '.png'), 162, 65, {fit: [100, 100]});

      doc.lineJoin('miter')
        .rect(0, 0, 262, 163)
        .stroke();

      if (results.card.store.image) {
        var image = results.card.store.image.split('/')
          , len = image.length;

        var r = request(results.card.store.image).pipe(fs.createWriteStream(path.join(__dirname, '../../../tmp/' + image[len])));
//        var r = request(results.card.store.image).pipe(fs.createWriteStream(path.join(__dirname, '../../.build/logo/' + image[len])));
        r.on('finish', function () {
//          doc.image(path.join(__dirname, '../../.build/logo/' + image[len]), 7, 76, {fit: [80, 80]});
          doc.image(path.join(__dirname, '../../../tmp/' + image[len]), 7, 76, {fit: [80, 80]});

          doc.output(function (string) {
            res.contentType = 'application/pdf';
            res.end(string);
          });
        });
      } else {
        doc.output(function (string) {
          res.contentType = 'application/pdf';
          res.end(string);
        });
      }

    });

  });

  router.get('/edit/:id', function (req, res) {

    var id = req.params.id;

    Card.findOne({ _id: id })
      .exec(function (err, card) {
        if (err) {
          console.log(err);
        }
        res.render('card/edit', { card: card });
      });

  });


  router.post('/edit', function (req, res) {

    var body = req.body;

    var card = {};

    if (body.user_id) {
      User.findById(body.user_id).exec(function (err, user) {
        card.user = user._id;
        Card.findByIdAndUpdate(body.id, { $set: card }, function (err, card) {
          res.redirect('/card/view/' + body.id);
        });
      });
    } else {
      res.redirect('/card/view/' + body.id);
    }

  });

  router.post('/remove', function (req, res) {

//    Store.findById(req.body.id, function (err, store) {
//      store.remove();
//      res.send(200);
//    });

  });

};