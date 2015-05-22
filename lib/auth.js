'use strict';

var Store = require('../models/store')
  , User = require('../models/user')
  , LocalStrategy = require('passport-local').Strategy;

exports.localStrategy = function () {
  return new LocalStrategy({
    passReqToCallback: true
  }, function (req, username, password, done) {
    var query = {}
      , array = username.split('@');
    if (array.length > 1) {
      query.email = username;
    } else {
      query.phone = username;
    }
    User.findOne(query, function (err, user) {
      if (err) {
        done(err);
        return;
      }
      if (!user || !user.passwordMatches(password)) {
        done(null, false, {message: 'Ошибка авторизации'});
        return;
      }
      done(null, user);
    });
  });
};

exports.isAuthenticated = function () {
  return function (req, res, next) {
    var auth = {
        '/login': true,
        '/register': true
      },
      blacklist = {
        'user': {
          '/admin': true
        }
      },
      route = req.url,
      role = (req.user && req.user.role) ? req.user.role : '';
    if (auth[route]) {
      next();
    }
    else if (!req.isAuthenticated()) {
      req.session.goingTo = req.url;
      req.flash('error', 'Пожалуйста, войтите.');
      res.redirect('/login');
    }
    else if (blacklist[role] && blacklist[role][route] === true) {
      var model = {url: route};
      res.locals.user = req.user;
      res.status(401);
      res.render('errors/401', model);
    } else {
      next();
    }
  };
};

exports.injectUser = function () {
  return function injectUser(req, res, next) {
    if (req.isAuthenticated()) {
      res.locals.user = req.user;
    }
    next();
  };
};
