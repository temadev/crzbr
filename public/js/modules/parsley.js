/**=========================================================
 * Module: parsley.js
 * Form Validation
 =========================================================*/

(function ($, window, document) {

  $(function () {

    if (!window.ParsleyValidator) return;

    window.ParsleyValidator.setLocale('ru');
    window.ParsleyValidator
      .addValidator('size', function (value, requirement) {
        return 0 === (value + '').length % requirement;
      }, 32)
      .addMessage('ru', 'size', 'Значение должно состоять из %s цифр');

  });

}(jQuery, window, document));