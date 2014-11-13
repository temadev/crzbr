'use strict';

var session = require('express-session')
  , RedisStore = require('connect-redis')(session);

module.exports = function(settings, redisConfig) {
  settings.store = new RedisStore(redisConfig);
  var impl = session(settings);
  return function(req, res, next) {
    return impl(req, res, function(err) {
      return next(err);
    });
  };
};
