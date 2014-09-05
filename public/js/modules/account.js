/**=========================================================
 * Module: account.js
 * Toggle the account creation
 =========================================================*/

(function ($, window, document) {

  var removeButton = '#modalRemoveBtn';

  $('#stores').on('click', '.btn-remove', function () {
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

  var removeUserButton = '#modalUserRemoveBtn';

  $('#users').on('click', '.btn-remove', function () {
    var id = $(this).data("id")
      , title = $(this).data("title");
    $('#title').text(title);
    $(removeUserButton).data('id', id)
  });

  $(document).on('click', removeUserButton, function () {

    var $this = $(this)
      , id = $this.data('id')
      , csrf = $this.data('csrf');

    $.ajax({
      type: 'post',
      url: '/user/remove/',
      data: { id: id, _csrf: csrf },
      success: function () {
        window.location.href = "/user";
      }
    });
  });


}(jQuery, window, document));