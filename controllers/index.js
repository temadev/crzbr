'use strict';


var IndexModel = require('../models/Index'),
  AdminModel = require('../models/Admin'),
  Store = require('../models/Store'),
  auth = require('../lib/auth');


module.exports = function (router) {

  var indexmodel = new IndexModel();
  var adminmodel = new AdminModel();


  router.get('/', function (req, res) {

    if (req.user.role === 'user') {
      res.redirect('/card/');
    } else {
      Store.find({user: req.user})
        .exec(function (err, stores) {
          if (err) {
            throw err;
          }
          if (stores.length !== 1) {
            res.redirect('/store/');
          } else {
            Store.findOne({_id: stores[0]._id}).exec(function (err, store) {
              res.redirect('/store/view/'+store._id);
            });
          }
        });
    }

  });


  router.get('/admin', auth.isAuthenticated('admin'), auth.injectUser(), function(req, res) {
    res.render('admin', adminmodel);
  });

  /**
   * Allow the users to log out
   */
  router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/login');
  });

};
