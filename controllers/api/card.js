'use strict';


var auth = require('../../lib/auth')
  , async = require('async')
  , Card = require('../../models/Card')
  , Profile = require('../../models/Profile')
  , User = require('../../models/User');

module.exports = function (router) {

  router.get('/list', auth.isAuthenticated(), function (req, res) {

    var regex = new RegExp(req.query.query, 'i');
    var query = {phone: regex};

    var suggestions = [];

    User.find(query).exec(function (err, users) {
      var foundUsers = [];
      async.each(users, function (user, cb) {
        var profileQuery = {user: user};
        if (req.user && req.user.role !== 'admin')
          profileQuery.owner = req.user._id;

        Profile.find(profileQuery).populate('user').exec(function (err, profile) {
          console.log(profile);
          async.each(profile, function (prof, cb) {
            foundUsers.push(prof);
            cb();
          }, function () {
            cb();
          })
        });

      }, function () {


        async.each(foundUsers, function (user, callback) {
          Card
            .find({user: user.user._id})
            .populate('store', 'title')
            .exec(function (err, cards) {
              if (cards.length > 0) {
                async.each(cards, function (card, cb) {
                  var lastname = user.lastname ? user.lastname : ''
                    , firstname = user.firstname ? user.firstname : ''
                    , middlename = user.middlename ? user.middlename : ''
                    , bonus = card.bonus ? card.bonus : 0
                    , curCard = {
                      data: card._id,
                      value: lastname + ' ' + firstname + ' ' + middlename + ' (' + user.user.phone + ') ' + ' [' + card.cc + '] ' + card.store.title + ' — Бонусы: ' + bonus
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


  });

};
