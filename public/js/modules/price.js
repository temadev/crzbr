(function ($, window, document) {

  $(function () {

    $('#priceSelect').on('change', function (e) {

      window.location.href = '/price/' + $(this).val();

    });

  });

}(jQuery, window, document));
