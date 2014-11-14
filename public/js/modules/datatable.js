/**=========================================================
 * Module: datatable.js
 * DateTime Picker init
 =========================================================*/

(function($, window, document){

  $(function(){

    if ( ! $.fn.dataTable ) return;

    //
    // Zero configuration
    //

    var dtInstance1 = $('#datatable-cards').dataTable({
      'paging':   true,  // Table pagination
      'ordering': true,  // Column ordering
      'info':     true,  // Bottom left status text
      'order': [
        [ 1, 'desc' ]
      ],
      // Text translation options
      // Note the required keywords between underscores (e.g _MENU_)
      language: {
        url: '//cdn.datatables.net/plug-ins/be7019ee387/i18n/Russian.json'
      }
    });
    var inputSearchClass1 = 'datatable-cards-search';
    var columnInputs1 = $('tfoot .'+inputSearchClass1);

    // On input keyup trigger filtering
    columnInputs1
      .keyup(function () {
        dtInstance1.fnFilter(this.value, columnInputs1.index(this)+1);
      });


    //
    // Filtering by Columns
    //

    var dtInstance2 = $('#datatable2').dataTable({
        'paging':   true,  // Table pagination
        'ordering': true,  // Column ordering
        'info':     true,  // Bottom left status text
        // Text translation options
        // Note the required keywords between underscores (e.g _MENU_)
        language: {
            url: '//cdn.datatables.net/plug-ins/be7019ee387/i18n/Russian.json'
        }
    });
    var inputSearchClass2 = 'datatable_input_col_search';
    var columnInputs2 = $('tfoot .'+inputSearchClass2);

    // On input keyup trigger filtering
    columnInputs2
      .keyup(function () {
          dtInstance2.fnFilter(this.value, columnInputs2.index(this));
      });



    var purchasesTable = $('#purchasesTable').dataTable({
        'paging':   true,  // Table pagination
        'ordering': true,  // Column ordering
        'info':     true,  // Bottom left status text
        'order': [
          [ 0, 'desc' ]
        ],
        // Text translation options
        // Note the required keywords between underscores (e.g _MENU_)
        language: {
            url: '//cdn.datatables.net/plug-ins/be7019ee387/i18n/Russian.json'
        }
    });
    var inputSearchPurchasesTable = 'datatable_input_col_search';
    var columnInputsPurchasesTable = $('tfoot .'+inputSearchPurchasesTable);

    // On input keyup trigger filtering
    columnInputsPurchasesTable
      .keyup(function () {
          purchasesTable.fnFilter(this.value, columnInputsPurchasesTable.index(this));
      });


    //
    // Filtering by Columns
    //

    var dtInstance3 = $('#datatable3').dataTable({
        'paging':   true,  // Table pagination
        'ordering': true,  // Column ordering
        'info':     true,  // Bottom left status text
        // Text translation options
        // Note the required keywords between underscores (e.g _MENU_)
        language: {
            url: '//cdn.datatables.net/plug-ins/be7019ee387/i18n/Russian.json'
        }
    });
    var inputSearchClass3 = 'datatable_input_col_search';
    var columnInputs3 = $('tfoot .'+inputSearchClass3);

    // On input keyup trigger filtering
    columnInputs2
      .keyup(function () {
          dtInstance3.fnFilter(this.value, columnInputs3.index(this)+1);
      });

  });

}(jQuery, window, document));
