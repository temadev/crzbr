/**=========================================================
 * Module: account.js
 * Toggle the account creation
 =========================================================*/

(function ($, window, document) {

  var removeButton = '#modalRemoveBtn';

  $(document).on('click', '.btn-remove', function () {
    var id = $(this).data("id")
      , title = $(this).data("title");
    $('#title').text(title);
    $(removeButton).data('id', id)
  });

  $(document).on('click', removeButton, function () {

    var $this = $(this)
      , id = $this.data('id')
      , csrf = $this.data('csrf');

    $.ajax({
      type: 'post',
      url: '/store/remove/',
      data: { id: id, _csrf: csrf },
      success: function () {
        window.location.href = "/store";
      }
    });
  });


}(jQuery, window, document));