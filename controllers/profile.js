'use strict';

var auth = require('../lib/auth')
  , async = require('async')
  , User = require('../models/user');

var easyimg = require('easyimage');

var s3 = require('s3')
  , client = s3.createClient({
    key: process.env.S3_KEY,
    secret: process.env.S3_SECRET,
    bucket: process.env.S3_BUCKET
  });

module.exports = function (router) {

  router.get('/', function (req, res) {

    res.render('profile/index');

  });

  router.get('/settings', function (req, res) {

    User.findById(req.user._id).exec(function (err, user) {
      res.render('profile/edit', {profile: user});
    });

  });

  router.post('/settings', function (req, res) {

    var user = {
      email: req.body.email,
      phone: req.body.phone,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      middlename: req.body.middlename,
      gender: req.body.gender,
      birth: formatDate(req.body.birth),
      city: req.body.city,
      updated: Date.now()
    };

    if (req.body.password && req.body.password !== '') {
      user.password = req.body.password;
    }

    User.findByIdAndUpdate(req.user._id, {$set: user}).exec(function (err, user) {
      imageCropUpload(req.files, user, function () {
        res.redirect('/profile');
      });
    });

  });

};

function imageCropUpload(files, user, cb) {
  if (files && files.photo && files.photo.name !== '' && (files.photo.type === 'image/jpeg' || files.photo.type === 'image/png')) {
    console.log(files);
    easyimg.rescrop({
      src: files.photo.path, dst: files.photo.path,
      width: 300, height: 300,
      cropwidth: 128, cropheight: 128,
      x: 0, y: 0,
      gravity: 'center'
    }).then(
      function (image) {
        image.name = files.photo.name;
        uploadS3(image, user._id, function () {
          cb();
        });
      },
      function (err) {
        console.log(err);
        cb();
      }
    );
  } else {
    cb();
  }
}

function uploadS3(file, user_id, cb) {
  if (file.size && file.path) {
    var uploader = client.upload(file.path, 'crzbr/' + user_id + '/' + file.name);
    uploader.on('error', function (err) {
      console.error('unable to upload:', err.stack);
    });
    uploader.on('progress', function (amountDone, amountTotal) {
      console.log('progress', amountDone, amountTotal);
    });
    uploader.on('end', function (url) {
      User.findById(user_id, function (err, user) {
        user.photo = url;
        user.save();
        if (cb) {
          cb(user.photo);
        }
      });
    });
  }
}

function formatDate(date) {
  var d = new Date();
  if (date !== '') {
    date = date.replace(/(\d+).(\d+).(\d+)/, '$2/$1/$3');
    d.setTime(Date.parse(date));
    date = d;
  }
  return date;
}
