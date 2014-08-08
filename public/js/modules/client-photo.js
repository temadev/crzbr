/**=========================================================
 * Module: datatable.js
 * DateTime Picker init
 =========================================================*/

(function($, window, document){

  $(function(){

    var files;
    // Add events
//    $('#clientPhoto').on('change', uploadFiles);
//    function uploadFiles(event) {
//      files = event.target.files;
//      var $this = $(this)
//        , $parent = $this.parent();
//      $this.prop('disabled', true);
//      $parent.append('<i class="fa fa-refresh fa-spin form-control-feedback"></i>');
//      $parent.find('.thumbnail').remove();
//      event.stopPropagation(); // Stop stuff happening
//      event.preventDefault(); // Totally stop stuff happening
//      // START A LOADING SPINNER HERE
//      // Create a formdata object and add the files
//      var data = new FormData();
//      $.each(files, function(key, value) {
//        data.append($this.prop('name'), value);
//      });
//      $.ajax({
//        url: '/user/file',
//        type: 'POST',
//        data: data,
//        cache: false,
//        dataType: 'json',
//        processData: false, // Don't process the files
//        contentType: false, // Set content type to false as jQuery will tell the server its a query string request
//        success: function(data, textStatus, jqXHR) {
//          if(typeof data.error === 'undefined') {
//            // Success so call function to process the form
//            // submitForm(event, data);
//            console.log(data);
//            $parent.find('.fa-refresh').remove();
//            $parent.append('<div class="thumbnail"><img src="'+ data.success +'" class="img-responsive"></div>');
//            $this.prop('disabled', false);
//          } else {
//            // Handle errors here
//            console.log('ERRORS: ' + data.error);
//          }
//        },
//        error: function(jqXHR, textStatus, errorThrown) {
//          // Handle errors here
//          console.log('ERRORS: ' + textStatus);
//          // STOP LOADING SPINNER
//        }
//      });
//    }

  });

}(jQuery, window, document));
