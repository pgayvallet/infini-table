'use strict';


itModule.factory("itDefaultConfig", function() {
    return {
        // row selection
        allowSelection              : false,
        selectionAttribute          : null,     // attribute to set / get selected model from / to.
        selectionScope              : null,     // the scope to get / set selection attribute from/to . Defaulting to the table parent scope.
        // sorting
        sortable                    : false,     // config.sortable || column.sortable
        initialSort                 : null,      // initial sorting column and order. either the index of the column or a tuple [columnIdx, "desc" | "asc"]
        keepIndexOnSort             : false,     // do we stay at current index after sorting or do we go back to index 0 ?
        // global events
        onScrollChange              : null,  // handler called when table render change (scroll, resize, dataSource change...) called with pagination as first parameter and ordered dataSource as second
        initialScroll               : 0,     // can be either a model, an index or a function given dataSource as only parameter and returning a model or an index.
        // row events
        hoverClass                  : null,
        onRowClick                  : null,
        onRowEnter                  : null,
        onRowLeave                  : null,
        eventApplyScope             : null,     // scope used for the apply of delegated event handler. Defaulting to the table scope.
        // Row management - cleanup & precompilation
        maxWatchers                 : 600,      // maximum number of watcher, after what the table will start to cleanup undisplayed rows.
        countRootWatchers           : false,    // if true, will count the rootScope's watchers instead of the table's.
        rowManagementCycleInterval  : 200,      // interval between cleanup / precompilation cycles
        preloadedPageCount          : 1,        // number of pages before/after current displayed data to preload
        rowPerManagementCycle       : 3,        // max number of row to compile/destroy per cycle
        // general config
        watch                       : false, // if set to true, the column definition using attribute (and optionally filter) will watch for changes. Else the value expression will only be interpolated once, at row creation
        height                      : 500,   // default height for the table is no sizing directive is used
        headerGroups                : [],    // 2nd level headers groups, default to no groups
        columnGroups                : [],    // columns group for columnn toggle features.
        // scrollbar config
        scrollbarWidth              : 12,   // width of the scrollbar. can be overridden for theming
        scrollbarThumbMinHeight     : 20,   // min height of the scrollbar thumb
        scrollbarThumbMaxHeight     : null, // max height of the scrollbar thumb
        // templates
        headerGroupRowTemplate      : '<tr class="it-group-row"></tr>',
        headerGroupCellTemplate     : '<th class="it-group-cell"></th>',
        headerRowTemplate           : '<tr class="it-header-row"></tr>',
        headerCellTemplate          : '<th class="it-header-cell"></th>',
        contentHeaderCellTemplate   : '<th class="body-header"></th>',
        rowTemplate                 : '<tr></tr>',
        cellTemplate                : '<td></td>'
    }
});
