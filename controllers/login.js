'use strict';

var passport = require('passport');

module.exports = function (router) {

  router.get('/', function (req, res) {
    res.render('login', {messages: req.flash('error')});
  });

  router.post('/', function (req, res) {

    passport.authenticate('local', {
      successRedirect: req.session.goingTo || '/profile',
      failureRedirect: '/login',
      failureFlash: true
    })(req, res);

  });

};
