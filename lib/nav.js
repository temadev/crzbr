'use strict';

var Nav = require('../models/Nav')
  , Store = require('../models/Store');

exports.currentPath = function (req, res, next) {

  console.log(res.locals.path);

  return next();
};

exports.injectNav = function () {
  return function injectNav(req, res, next) {
    if (req.user) {
      Store.count({user: req.user._id}).exec(function (err, count) {
        res.locals.nav = new Nav(req.user, count);
        next();
      });
    } else {
      next();
    }
  };
};
