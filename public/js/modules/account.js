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

  var removePurchaseButton = '#modalPurchaseRemoveBtn';

  $('#purchases').on('click', '.btn-remove', function () {
    var id = $(this).data("id")
      , title = $(this).data("title");
    $('#title').text(title);
    $(removePurchaseButton).data('id', id)
  });

  $(document).on('click', removePurchaseButton, function () {

    var $this = $(this)
      , id = $this.data('id')
      , csrf = $this.data('csrf');

    $.ajax({
      type: 'post',
      url: '/purchase/remove/',
      data: { id: id, _csrf: csrf },
      success: function () {
        window.location.href = "/purchase";
      }
    });
  });

  var removeCardButton = '#modalCardRemoveBtn';

  $('#cards').on('click', '.btn-remove', function () {
    var id = $(this).data("id")
      , title = $(this).data("title");
    $('#title').text(title);
    $(removeCardButton).data('id', id)
  });

  $(document).on('click', removeCardButton, function () {

    var $this = $(this)
      , id = $this.data('id')
      , csrf = $this.data('csrf');

    $.ajax({
      type: 'post',
      url: '/card/remove/',
      data: { id: id, _csrf: csrf },
      success: function () {
        window.location.href = "/card";
      }
    });
  });

  $(document).on('click', '#printCards', function (e) {

    e.preventDefault();

    var printArray = []
      , csrf = $(this).data('csrf')
      , inputs = '';

    $('.print-card').each(function() {
      var $this = $(this);
      if ($this.prop('checked')) {
        inputs += '<input type="hidden" name="print" value="' + $this.val() + '">';
        printArray.push($this.val());
      }

    });

    if (printArray.length>0) {
      $('<form action="/card/printSelected" method="POST">' +
      inputs +
      '<input type="hidden" name="_csrf" value="' + csrf + '">' +
      '</form>').submit();
    }

  });


}(jQuery, window, document));
