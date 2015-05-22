'use strict';

var auth = require('../lib/auth')
  , async = require('async')
  , Message = require('../models/message')
  , Store = require('../models/store')
  , Card = require('../models/card')
  , User = require('../models/user')
  , Purchase = require('../models/purchase');

module.exports = function (router) {

  router.get('/', function (req, res) {

    var query = {};

    if (req.user && req.user.role !== 'admin') {
      query = {user: req.user};
    }

    var allMessages = [];

    if (req.user.role === 'user') {
      Message
        .find({recipient: req.user._id})
        .populate('store', 'title image')
        .sort({date: -1})
        .exec(function (err, messages) {
          res.render('message/index', {messages: messages});
        });
    } else {
      Store.find(query, function (err, stores) {
        async.each(stores, function (store, cb) {
          Message
            .find({store: store._id})
            .populate('store', 'title image')
            .populate('recipient', 'firstname lastname middlename')
            .exec(function (err, message) {
              async.each(message, function (item, cb) {
                allMessages.push(item);
                cb();
              }, function () {
                cb();
              });
            });
        }, function () {
          res.render('message/index', {messages: allMessages});
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
      res.render('message/create', {stores: stores});
    });

  });

  router.post('/create', auth.isAuthenticated(), function (req, res) {
    var message = req.body;
    message.date = new Date();
    message.recipient = message.user_id;
    var newMessage = new Message(message);
    newMessage.save();
    res.redirect('/message');
  });

  router.get('/view/:id', auth.isAuthenticated(), function (req, res) {

    var id = req.params.id;

    Message.findById(id).exec(function (err, message) {
      res.render('message/view', {message: message});
    });

  });

  router.get('/edit/:id', auth.isAuthenticated(), function (req, res) {

    var id = req.params.id;

    Message
      .findById(id)
      .exec(function (err, message) {
        res.render('message/edit', {message: message});
      });

  });

  router.post('/edit', auth.isAuthenticated(), function (req, res) {

    var id = req.body.id;
    var message = req.body;

    Message.findByIdAndUpdate(id, {$set: message}, function (err, message) {
      res.redirect('/message');
    });

  });

  router.post('/remove', function (req, res) {

    Message.findById(req.body.id, function (err, message) {
      if (message) {
        message.remove();
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
