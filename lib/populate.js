'use strict';

var mongoose = require('mongoose')
  , async = require('async')
  , request = require('request')
  , cc = require('coupon-code');

mongoose.set('debug', true);

function populateDB() {
  async.series([
    open,
    dropDatabase,
    requireModels,
    createUsers,
    createStore,
    createCard,
    createPrice,
    createPurchase
  ], function (err) {
    console.log(arguments);
    mongoose.disconnect();
    process.exit(err ? 255 : 0);
  });
}

function open(callback) {
  mongoose.connection.on('open', callback);
}

function dropDatabase(callback) {
  var db = mongoose.connection.db;
  db.dropDatabase(callback);
}

function requireModels(callback) {
  require('../models/user');
  require('../models/store');
  require('../models/card');
  require('../models/price');
  require('../models/purchase');

  async.each(Object.keys(mongoose.models), function (modelName, callback) {
    mongoose.models[modelName].ensureIndexes(callback);
  }, callback);
}

function createUsers(callback) {
  var users = [
    {
      firstname: 'Artem',
      lastname: 'Kashin',
      email: 'admin@crazybuyer.ru',
      password: '111111',
      role: 'admin',
      joined: Date.now()
    },
    {
      firstname: 'Pavel',
      lastname: 'Lysov',
      email: 'user@crazybuyer.ru',
      password: '111111',
      role: 'user',
      phone: '79206590090',
      joined: Date.now()
    }
  ];

  async.each(users, function (userData, callback) {
    var user = new mongoose.models.User(userData);
    user.save(callback);
  }, callback);
}

function createStore(callback) {
  mongoose.models.User.findOne({email: 'admin@crazybuyer.ru'}, function (err, user) {
    var stores = [
      {
        title: 'КосаДоПояса',
        description: 'Место, где заплетают косы',
        image: 'https://s3-eu-west-1.amazonaws.com/crazybuyer/logo_kosa.jpg',
        status: true,
        user: user
      },
      {
        title: 'Giovane Gentile',
        description: 'Магазин мужской одежды в Ярославле',
        status: true,
        user: user
      }
    ];

    async.each(stores, function (storeData, callback) {
      var store = new mongoose.models.Store(storeData);
      store.save(callback);
    }, callback);
  });
}

function createCard(callback) {
  async.parallel({
    user: function (callback) {
      mongoose.models.User.findOne({email: 'user@crazybuyer.ru'}, function (err, user) {
        if (err) {
          throw err;
        }
        callback(null, user);
      });
    },
    stores: function (callback) {
      mongoose.models.Store.find({}, function (err, stores) {
        if (err) {
          throw err;
        }
        callback(null, stores);
      });
    }
  }, function (err, results) {
    if (err) {
      throw err;
    }
    var cards = [
      {
        store: results.stores[0],
        user: results.user,
        cc: cc.generate({ parts : 4 }),
        created: Date.now()
      },
      {
        store: results.stores[1],
        user: results.user,
        cc: cc.generate({ parts : 4 }),
        created: Date.now()
      }
    ];

    async.each(cards, function (cardData, callback) {
      var card = new mongoose.models.Card(cardData);
      card.save(callback);
    }, callback);
  });
}

function createPrice(callback) {
  mongoose.models.Store.findOne({title: 'КосаДоПояса'}, function (err, store) {
    var prices = [
      {
        store: store,
        title: 'Выпрямление (короткие)',
        price: 100,
        status: true
      },
      {
        store: store,
        title: 'Выпрямление (средние)',
        price: 150,
        status: true
      },
      {
        store: store,
        title: 'Выпрямление (длинные)',
        price: 200,
        status: true
      },
      {
        store: store,
        title: 'Локоны (короткие)',
        price: 100,
        status: true
      },
      {
        store: store,
        title: 'Локоны (средние)',
        price: 200,
        status: true
      },
      {
        store: store,
        title: 'Локоны (длинные)',
        price: 300,
        status: true
      },
      {
        store: store,
        title: 'Волна (короткие)',
        price: 200,
        status: true
      },
      {
        store: store,
        title: 'Волна (средние)',
        price: 300,
        status: true
      },
      {
        store: store,
        title: 'Волна (длинные)',
        price: 500,
        status: true
      },
      {
        store: store,
        title: 'Укладка/начес (короткие)',
        price: 200,
        status: true
      },
      {
        store: store,
        title: 'Укладка/начес (средние)',
        price: 250,
        status: true
      },
      {
        store: store,
        title: 'Вечерняя укладка (короткие)',
        price: 300,
        status: true
      },
      {
        store: store,
        title: 'Вечерняя укладка (средние)',
        price: 500,
        status: true
      },
      {
        store: store,
        title: 'Вечерняя укладка (длинные)',
        price: 900,
        status: true
      },
      {
        store: store,
        title: 'Плетение колосок (1 коса)',
        price: 250,
        status: true
      },
      {
        store: store,
        title: 'Плетение колосок (2 косы)',
        price: 300,
        status: true
      },
      {
        store: store,
        title: 'Плетение колосок (корзинка)',
        price: 350,
        status: true
      },
      {
        store: store,
        title: 'Плетение «французское» (1 коса)',
        price: 300,
        status: true
      },
      {
        store: store,
        title: 'Плетение «французское» (2 косы)',
        price: 350,
        status: true
      },
      {
        store: store,
        title: 'Плетение «французское» (корзинка)',
        price: 400,
        status: true
      },
      {
        store: store,
        title: 'Плетение «рыбий хвост» (1 коса)',
        price: 300,
        status: true
      },
      {
        store: store,
        title: 'Плетение «рыбий хвост» (2 косы)',
        price: 350,
        status: true
      },
      {
        store: store,
        title: 'Плетение «рыбий хвост» (корзинка)',
        price: 400,
        status: true
      }
    ];

    async.each(prices, function (priceData, callback) {
      var price = new mongoose.models.Price(priceData);
      price.save(callback);
    }, callback);
  });
}

function createPurchase(callback) {
  mongoose.models.Card.findOne({}, {}, { sort: { 'created_at' : 1 }}, function (err, card) {
    if (err) {
      throw err;
    }
    var purchases = [
      {
        card: card,
        title: 'Выпрямление (длинные)',
        date: Date.now(),
        price: 200,
        quantity: 1,
        total: 200
      },
      {
        card: card,
        title: 'Укладка/начес (средние)',
        date: Date.now(),
        price: 250,
        quantity: 2,
        total: 500
      },
      {
        card: card,
        title: 'Плетение «французское» (2 косы)',
        date: Date.now(),
        price: 350,
        quantity: 1,
        total: 350
      },
      {
        card: card,
        title: 'Плетение «рыбий хвост» (корзинка)',
        date: Date.now(),
        price: 400,
        quantity: 1,
        total: 400
      }
    ];

    async.each(purchases, function (purchaseData, callback) {
      var purchase = new mongoose.models.Purchase(purchaseData);
      purchase.save(callback);
    }, callback);
  });
}

module.exports = populateDB();