'use strict';

var session = require('express-session')
  , RedisStore = require('connect-redis')(session);

module.exports = function(settings) {
  settings.store = new RedisStore({ url: process.env.REDISCLOUD_URL });
  var impl = session(settings);
  return function(req, res, next) {
    return impl(req, res, function(err) {
      return next(err);
    });
  };
};
