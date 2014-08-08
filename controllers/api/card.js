'use strict';


var auth = require('../../lib/auth')
  , async = require('async')
  , Card = require('../../models/card')
  , User = require('../../models/user');

module.exports = function (router) {

  router.get('/list', auth.isAuthenticated(), function (req, res) {

    var regex = new RegExp(req.query.query, 'i');

    var query = User.find({phone: regex}, { 'email': 1, 'phone': 1, 'firstname': 1, 'lastname': 1, 'middlename': 1 }).sort({'updated': -1}).sort({'created': -1}).limit(20);
    var suggestions = [];

    query.exec(function (err, users) {
      async.each(users, function (user, callback) {
        Card.findOne({user: user._id}).exec(function (err, card) {
          if (card) {
            var curCard = {
              data: card._id,
              value: user.lastname + ' ' + user.firstname + ' ' + user.middlename + ' (' + user.phone + ') ' + ' [' + card.cc + ']'
            };
            suggestions.push(curCard);
            callback();
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