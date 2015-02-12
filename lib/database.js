'use strict';


var mongoose = require('mongoose');

var db = function () {
  return {

    /**
     * Open a connection to the database
     */
    config: function () {
      mongoose.connect(process.env.MONGOLAB_URI);
      var db = mongoose.connection;
      db.on('error', console.error.bind(console, 'connection error:'));
      db.once('open', function callback() {
        console.log('db connection open');
      });
    }
  };
};

module.exports = db();
