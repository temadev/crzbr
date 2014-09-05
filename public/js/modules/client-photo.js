/**=========================================================
 * Module: datatable.js
 * DateTime Picker init
 =========================================================*/

(function($, window, document){

  $(function(){

    var form = $('#clientForm');

    form.bootstrapValidator()
      .on('success.form.bv', function (e) {

        e.preventDefault();

        var $form = $(e.target)
          , validator = $form.data('bootstrapValidator')
          , submitButton = validator.getSubmitButton();

        $.post($form.attr('action'), $form.serialize(), function (result) {

          if (result.id && result.title) {
            $('#autocomplete-users').val(result.title + ' (' + result.phone + ')');
            $('#selction-users').val(result.id);
            $('#modalNewClient').modal('hide');
          }
          if (result.message) {
            $('#clientMessage').html(result.message).show();
          }

        }, 'json');

      });

  });

}(jQuery, window, document));
