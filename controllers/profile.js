'use strict';

var auth = require('../lib/auth')
  , async = require('async')
  , User = require('../models/user');

module.exports = function (router) {

  router.get('/', function (req, res) {

    res.format({
      json: function () {
        res.json({});
      },
      html: function () {
        res.render('profile/index', {});
      }
    });
  });


  router.get('/settings', function (req, res) {
    User.findOne({_id: req.user._id})
      .exec(function (err, user) {
        res.render('user/edit', {client: user, profile: true});
      });
  });

};
