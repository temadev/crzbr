'use strict';

var passport = require('passport')
  , auth = require('../lib/auth')
  , userLib = require('./user')()
  //, populate = require('./populate')
  , db = require('../lib/database')
  , crypto = require('../lib/crypto');

module.exports = function spec(app) {

  app.on('middleware:after:session', function configPassport(eventargs) {
    passport.use(auth.localStrategy());
    passport.serializeUser(userLib.serialize);
    passport.deserializeUser(userLib.deserialize);
    app.use(passport.initialize());
    app.use(passport.session());
  });
  return {
    onconfig: function(config, next) {

      var cryptConfig = config.get('bcrypt');

      crypto.setCryptLevel(cryptConfig.difficulty);
      db.config();

      next(null, config);
    }
  };

};
