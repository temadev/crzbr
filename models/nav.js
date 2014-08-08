'use strict';


module.exports = function NavModel() {
  return {
    menu: {
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
      }
    }
  };
};