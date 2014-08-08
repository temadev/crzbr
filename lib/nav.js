'use strict';

var NavModel = require('../models/nav');

exports.currentPath = function (req, res, next) {

  console.log(res.locals.path);

  return next();
};