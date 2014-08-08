'use strict';


var auth = require('../../lib/auth')
  , async = require('async')
  , Price = require('../../models/price');

module.exports = function (router) {

  router.get('/list', auth.isAuthenticated(), function (req, res) {

    var regex = new RegExp(req.query["query"], 'i');
    var query = Price.find({title: regex}, { 'title': 1, 'price': 1 }).sort({"updated": -1}).sort({"created": -1}).limit(20);
    var suggestions = [];

    query.exec(function (err, prices) {
      if (err) {
        console.log(err);
      }
      async.each(prices, function (price, callback) {
        var curPrice = {
          data: price.price,
          value: price.title + ' (' + price.price + ')'
        };
        suggestions.push(curPrice);
        callback();
      }, function (err) {
        res.json({
          query: req.query["query"],
          suggestions: suggestions
        });
      });
    });

  });

};