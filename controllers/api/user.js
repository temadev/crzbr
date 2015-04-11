'use strict';


var auth = require('../../lib/auth')
  , async = require('async')
  , User = require('../../models/User')
  , Profile = require('../../models/Profile');

module.exports = function (router) {

  router.get('/list', auth.isAuthenticated(), function (req, res) {

    var regex = new RegExp(req.query.query, 'i');
    var query = {};
    if (req.user && req.user.role !== 'admin') {
      query = {owner: req.user._id};
    }
    var suggestions = [];
console.log(req.user._id);
    Profile
      .find(query)
      .populate('user')
      .sort({'updated': -1})
      .sort({'created': -1})
      .exec(function (err, profiles) {
        console.log(profiles);
        if (err) {
          console.log(err);
        }
        async.each(profiles, function (user, callback) {
          console.log(user);
          if (user.user && regex.test(user.user.phone)) {
            if (!user.middlename) {
              user.middlename = '';
            }
            var curUser = {
              data: user.user._id,
              value: user.lastname + ' ' + user.firstname + ' ' + user.middlename + ' (' + user.user.phone + ')'
            };
            suggestions.push(curUser);
          }
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
