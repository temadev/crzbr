'use strict';

var User = require('../models/User');
var SMSru = require('sms_ru')
  , sms = new SMSru(process.env.SMS_API);

module.exports = function (router) {

  router.get('/', function (req, res) {
    res.render('register', {messages: req.flash('error')});
  });

  router.post('/', function (req, res) {
    if (!req.body.phone || !req.body.name || req.body.name.split(' ').length < 2) {
      req.flash('error', 'Проверьте корректность введенных данных');
      res.render('register', {messages: req.flash('error')});
    } else {
      User.findOne({phone: req.body.phone}).exec(function (err, user) {
        if (user) {
          req.flash('error', 'Вы уже регистрировались, попробуйте войти');
          res.render('register', {messages: req.flash('error')});
        }
        if (!user) {
          var pass = getRandomInt(1000, 9999)
            , name = req.body.name.split(' ');
          var newUser = new User({
            phone: req.body.phone,
            firstname: name[0],
            lastname: name[1],
            password: pass
          });

          newUser.save(function (err, user) {
            console.log(arguments);
            sms.sms_send({
              to: '79108228988',
              text: 'CRAZYBUYER пароль: ' + pass
            }, function (e) {
              console.log(e.description);
              req.flash('info', 'Посмотрите ваш пароль в смс');
              res.render('login', {messages: req.flash('info')});
            });
          });
        }
      });
    }

  });

};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
