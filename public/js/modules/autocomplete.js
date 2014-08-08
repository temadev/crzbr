/**=========================================================
 * Module: autocomplete.js
 * Autocomplete module
 =========================================================*/

(function ($, window, document) {

  $(function() {

    if (!$.fn.autocomplete) return;

    $('#autocomplete-users').autocomplete({
      serviceUrl: '/api/user/list',
      onSelect: function (suggestion) {
        $('#selction-users').val(suggestion.data);
      },
      onInvalidateSelection: function () {
        $('#selction-users').val('');
      }
    });


    var store = $('#storeSelect');

    $('#autocomplete-cards').autocomplete({
      serviceUrl: '/api/card/list',
      onSelect: function (suggestion) {
        $('#selction-cards').val(suggestion.data);
      },
      onInvalidateSelection: function () {
        $('#selction-cards').val('');
      }
    });

//    var ac = $('#autocomplete-cards').autocomplete();
//
//    ac.setOptions({ params: {store: store.val()} });
//    store.on('change', function () {
//      ac.setOptions({ params: {store: $(this).val()} });
//    });
//    ac.enable();

    $('#autocomplete-purchases').autocomplete({
      serviceUrl: '/api/price/list',
      onSelect: function (suggestion) {
        $('#selction-prices').val(suggestion.data);
      },
      onInvalidateSelection: function () {
        $('#selction-prices').val('');
      }
    });

  });


}(jQuery, window, document));