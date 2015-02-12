/**=========================================================
 * Module: account.js
 * Toggle the account creation
 =========================================================*/

(function ($, window, document) {

  var removeButton = '#modalRemoveBtn';

  $(document).on('click', '.btn-remove', function () {
    var $this = $(this)
      , id = $this.data('id')
      , type = $this.data('type')
      , title = $this.data('title')
      , back = $this.data('back')
      , label = 'Вы собираетесь удалить';

    if (type === 'user') {
      label = label + ' клиента ' + title
    }
    if (type === 'store') {
      label = label + ' магазин ' + title
    }
    if (type === 'card') {
      label = label + ' карту ' + title
    }
    if (type === 'purchase') {
      label = label + ' покупку ' + title
    }
    if (type === 'price') {
      label = label + ' товар/услугу ' + title
    }

    $('#modalRemoveTitle').text(label);
    $(removeButton).data('id', id);
    $(removeButton).data('type', type);
    $(removeButton).data('back', back);
  });

  $(document).on('click', removeButton, function () {
    var $this = $(this)
      , id = $this.data('id')
      , type = $this.data('type')
      , back = $this.data('back')
      , csrf = $this.data('csrf');

    $.ajax({
      type: 'post',
      url: '/' + type + '/remove/',
      data: {id: id, _csrf: csrf},
      success: function () {
        if (back) {
          window.location.href = back;
        } else {
          window.location.href = '/' + type;
        }
      }
    });
  });

  $(document).on('click', '#printCards', function (e) {

    e.preventDefault();

    var printArray = []
      , csrf = $(this).data('csrf')
      , inputs = '';

    $('.print-card').each(function () {
      var $this = $(this);
      if ($this.prop('checked')) {
        inputs += '<input type="hidden" name="print" value="' + $this.val() + '">';
        printArray.push($this.val());
      }

    });

    if (printArray.length > 0) {

      $('#printLoading').modal('show');

      $('<form action="/card/printSelected" method="POST">' +
      inputs +
      '<input type="hidden" name="_csrf" value="' + csrf + '">' +
      '</form>').submit();
    }

  });


}(jQuery, window, document));
