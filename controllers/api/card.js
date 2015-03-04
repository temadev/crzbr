'use strict';


var auth = require('../../lib/auth')
  , async = require('async')
  , Card = require('../../models/Card')
  , User = require('../../models/User');

module.exports = function (router) {

  router.get('/list', auth.isAuthenticated(), function (req, res) {

    var regex = new RegExp(req.query.query, 'i');
    var query = {phone: regex};
    if (req.user && req.user.role !== 'admin') {
      query = {phone: regex, owner: req.user._id};
    }

    var suggestions = [];

    User
      .find(query, {'email': 1, 'phone': 1, 'firstname': 1, 'lastname': 1, 'middlename': 1})
      .sort({'updated': -1})
      .sort({'created': -1})
      .limit(20)
      .exec(function (err, users) {
        async.each(users, function (user, callback) {
          Card
            .find({user: user._id})
            .populate('store', 'title')
            .exec(function (err, cards) {
              if (cards.length > 0) {
                async.each(cards, function (card, cb) {
                  var curCard = {
                    data: card._id,
                    value: user.lastname + ' ' + user.firstname + ' ' + user.middlename + ' (' + user.phone + ') ' + ' [' + card.cc + '] ' + card.store.title
                  };
                  suggestions.push(curCard);
                  cb();
                }, function () {
                  callback();
                });
              } else {
                callback();
              }
            });
        }, function () {
          res.json({
            query: req.query.query,
            suggestions: suggestions
          });
        });
      });

  });

};
