'use strict';


var auth = require('../../lib/auth')
  , async = require('async')
  , User = require('../../models/user');

module.exports = function (router) {

  router.get('/list', auth.isAuthenticated(), function (req, res) {

    var regex = new RegExp(req.query.query, 'i');
    var query = {phone: regex};
    if (req.user && req.user.role !== 'admin')
      query = {phone: regex, owner: req.user._id};
    var suggestions = [];

    User
      .find(query, {'email': 1, 'phone': 1, 'firstname': 1, 'lastname': 1, 'middlename': 1})
      .sort({'updated': -1})
      .sort({'created': -1})
      .limit(20)
      .exec(function (err, users) {
        if (err) {
          console.log(err);
        }
        async.each(users, function (user, callback) {
          if (!user.middlename) {
            user.middlename = '';
          }
          var curUser = {
            data: user._id,
            value: user.lastname + ' ' + user.firstname + ' ' + user.middlename + ' (' + user.phone + ')'
          };
          suggestions.push(curUser);
          callback();
        }, function (err) {
          res.json({
            query: req.query.query,
            suggestions: suggestions
          });
        });
      });

  });

};
