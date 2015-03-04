'use strict';

var auth = require('../lib/auth')
  , async = require('async')
  , News = require('../models/News')
  , Store = require('../models/Store')
  , Card = require('../models/Card')
  , User = require('../models/User')
  , Purchase = require('../models/Purchase');

module.exports = function (router) {

  router.get('/', function (req, res) {

    var query = {};

    if (req.user && req.user.role !== 'admin') {
      query = {user: req.user};
    }

    var allNews = [];

    if (req.user.role === 'user') {
      var userStores = [];
      Card.find({user: req.user._id}).exec(function (err, cards) {
        async.each(cards, function (card, cb) {
          userStores.push(card.store);
          cb();
        }, function () {
          async.each(userStores, function (store, cb) {
            News
              .find({store: store})
              .populate('store', 'title image')
              .exec(function (err, news) {
                async.each(news, function (item, cb) {
                  allNews.push(item);
                  cb();
                }, function () {
                  cb();
                });
              });
          }, function () {
            res.render('news/index', {news: allNews});
          });
        });
      });
    } else {
      Store.find(query, function (err, stores) {
        async.each(stores, function (store, cb) {
          News
            .find({store: store._id})
            .populate('store', 'title image')
            .exec(function (err, news) {
              async.each(news, function (item, cb) {
                allNews.push(item);
                cb();
              }, function () {
                cb();
              });
            });
        }, function () {
          res.render('news/index', {news: allNews});
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
      res.render('news/create', {stores: stores});
    });

  });

  router.post('/create', auth.isAuthenticated(), function (req, res) {
    var news = req.body;
    news.date = formatDate(news.date);
    var newNews = new News(news);
    newNews.save();
    res.redirect('/news');
  });

  router.get('/view/:id', auth.isAuthenticated(), function (req, res) {

    var id = req.params.id;

    News.findById(id).exec(function (err, news) {
      res.render('news/view', {news: news});
    });

  });

  router.get('/edit/:id', auth.isAuthenticated(), function (req, res) {

    var id = req.params.id;

    var query = {};

    if (req.user && req.user.role !== 'admin') {
      query = {user: req.user};
    }

    Store.find(query, function (err, stores) {
      News
        .findById(id)
        .exec(function (err, news) {
          res.render('news/edit', {news: news, stores: stores});
        });
    });

  });

  router.post('/edit', auth.isAuthenticated(), function (req, res) {

    var id = req.body.id;
    var news = req.body;
    news.date = formatDate(news.date);

    News.findByIdAndUpdate(id, {$set: news}, function (err, news) {
      res.redirect('/news');
    });

  });

  router.post('/remove', function (req, res) {

    News.findById(req.body.id, function (err, news) {
      if (news) {
        news.remove();
      }
      res.send(200);
    });

  });

};

function formatDate(date) {
  var d = new Date();
  if (date !== '') {
    date = date.replace(/(\d+).(\d+).(\d+)/, '$2/$1/$3');
    d.setTime(Date.parse(date));
    date = d;
  }
  return date;
}
