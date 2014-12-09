'use strict';

var Store = require('../models/store');

module.exports = function (user, count) {
  var menu = {
    'Магазины': {
      href: '/store',
      icon: 'fa fa-shopping-cart',
      active: 0
    },
    'Клиенты': {
      href: '/user',
      icon: 'fa fa-users',
      active: 0
    }
  };

  if (user.role === 'user') {
    menu = {
      'Карты': {
        href: '/card',
        icon: 'fa fa-credit-card',
        active: 0
      },
      'Покупки': {
        href: '/purchase',
        icon: 'fa fa-exchange',
        active: 0
      },
      'Купоны': {
        href: '/coupon',
        icon: 'fa fa-tags',
        active: 0
      },
      'Новости': {
        href: '/news',
        icon: 'fa fa-newspaper-o',
        active: 0
      },
      'Сообщения': {
        href: '/message',
        icon: 'fa fa-comments',
        active: 0
      }
    };
  }
  else if (count && count > 0) {
    menu = {
      'Магазины': {
        href: '/store',
        icon: 'fa fa-shopping-cart',
        active: 0
      },
      'Карты': {
        href: '/card',
        icon: 'fa fa-credit-card',
        active: 0
      },
      'Покупки': {
        href: '/purchase',
        icon: 'fa fa-exchange',
        active: 0
      },
      'Клиенты': {
        href: '/user',
        icon: 'fa fa-users',
        active: 0
      },
      'Прайслисты': {
        href: '/price',
        icon: 'fa fa-rouble',
        active: 0
      },
      'Купоны': {
        href: '/coupon',
        icon: 'fa fa-tags',
        active: 0
      },
      'Новости': {
        href: '/news',
        icon: 'fa fa-newspaper-o',
        active: 0
      },
      'Сообщения': {
        href: '/message',
        icon: 'fa fa-comments',
        active: 0
      }
    };
  }

  return menu;
};
