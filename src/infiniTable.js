'use strict';

itModule.controller("InfiniTableController", function($scope, $element,
                                                      $parse, $compile, $interpolate, $rootScope, $window,
                                                      itDefaultConfig, itSortFactory, itUtils) {

    var ctrl = this,
        config,
        scrollbar,
        context = {
            pagination : {},
            sort : {}
        },
        linkers = {};

    var ui = {
        table           : $element,
        headDiv         : $element.find(".it-head"),
        headTable       : $element.find(".it-head table"),
        headColgroup    : $element.find(".it-head table colgroup"),
        contentDiv      : $element.find(".it-body"),
        contentTable    : $element.find(".it-body table"),
        contentColgroup : $element.find(".it-body table colgroup"),
        contentHead     : $element.find(".it-body table thead"),
        contentHeadRow  : $element.find(".it-body table thead tr"),
        contentBody     : $element.find(".it-body table tbody")
    };

    ctrl.initializeTable = function(tableConfig) {

        config = _.extend({}, angular.copy(itDefaultConfig), tableConfig);

        compileTemplates();
        computeColumns(true);

        initializeHeaders();
        initializeRowEvents();  // TODO : undelegate before re-applying (for config change / reload)

        ctrl.setDatasource([]);

        if(config.allowSelection) {
            initializeRowSelection();  // TODO : undelegate before re-applying (for config change / reload)
        }

        // probably not it place
        ctrl.setHeight(config.height);
    };

    ctrl.$setScrollbarCtrl = function(_scrollbarCtrl) {
        scrollbar = _scrollbarCtrl
    };

    var compileTemplates = function() {
        linkers.headerGroupRow = $compile(config.headerGroupRowTemplate);
        linkers.headerGroupCell = $compile(config.headerGroupCellTemplate);
        linkers.headerRow = $compile(config.headerRowTemplate);
        linkers.headerCell = $compile($(config.headerCellTemplate).attr("it-header-cell", ""));
        linkers.contentHeaderCell = $compile(config.contentHeaderCellTemplate);
        linkers.row = $compile($(config.rowTemplate).attr("it-row", "")); // manually add row directive
        linkers.cell = $compile(config.cellTemplate);
    };

    var computeColumns = function(initial) {

        // TODO : split between compilation and refresh to avoid 'initial' parameter

        var computed = [];
        var groups = config.headerGroups;
        var columns = config.columns;

        var findGroup = function(idx) {
            for(var i=0; i<groups.length; i++) {
                if(idx >= groups[i].fromColumn && idx <= groups[i].toColumn) {
                    return groups[i];
                }
            }
            return null;
        };

        var makeCellInjector = function(column) {

            var cellLinkFn,
                cellTemplate = $(config.cellTemplate);

            if(column.cellClass) {
                cellTemplate.addClass(column.cellClass);
            }

            if(column.template) {
                var cellContentTemplate = _.result(column, "template");
                cellTemplate.html(cellContentTemplate);
                cellLinkFn = $compile(cellTemplate);
                return function(rowEl, rowScope) {
                    cellLinkFn(rowScope, function(cellElement) {
                        cellElement.appendTo(rowEl);
                    });
                };
            } else {
                var expression = column.expression ? column.expression : column.filter ? "{{ model." + column.attribute + " | " + column.filter + " }}"  : "{{ model." + column.attribute + " }}";
                if(column.watch || config.watch) { // TODO : test can be improved
                    cellTemplate.text(expression); // TODO : check html / text -> as column parameter probably
                    cellLinkFn = $compile(cellTemplate);
                    return function(rowEl, rowScope) {
                        cellLinkFn(rowScope, function(cellElement) {
                            cellElement.appendTo(rowEl);
                        });
                    };
                } else {
                    var interpolateFn =  $interpolate(expression);
                    cellLinkFn = $compile(cellTemplate);
                    return function(rowEl, rowScope) {
                        cellLinkFn(rowScope, function(cellElement) {
                            var cellContent = interpolateFn(rowScope);
                            cellElement.html(cellContent);
                            cellElement.appendTo(rowEl);
                        });
                    }
                }
            }
        };


        // header injector doesnt create the header cell, only inject template inside it.
        var makeHeaderInjector = function(column) {
            if(column.headerTemplate) {
                var headerContentTemplate = _.result(column, "headerTemplate");
                var headerContentLinkFn = $compile(headerContentTemplate);
                return function(headerCell, headerScope) {
                    headerContentLinkFn(headerScope, function(headerContent) {
                        headerCell.append(headerContent);
                    });
                };
            } else {
                return function(headerCell, headerScope) {
                    var titles = column.titles || [column.title];
                    _.each(titles, function(title, i) {
                        var titleSpan = $("<span>")
                            .addClass("it-title")
                            .addClass("it-title-" + i)
                            .text(title);
                        headerCell.append(titleSpan);
                    });
                }
            }
        };

        // process columns configuration
        _.each(columns, function(column, i) {
            var columnGroup = findGroup(i);
            computed.push({
                index           : i,
                column          : column,
                group           : columnGroup,
                headerInjector  : makeHeaderInjector(column),
                cellInjector    : makeCellInjector(column),
                sortable        : column.sortable || (config.sortable && column.sortable !== false),
                visible         : column.visible != null ? column.visible : true
            });
        });
        context.columns = computed;

        if(initial) {
            _.each(config.columnGroups, function(columnGroup) {
                var visible = _.has(columnGroup, "visible") ? columnGroup.visible : true;
                _.each(columnGroup.columns, function(columnIdx) {
                    context.columns[columnIdx].visible = visible;
                });
            });
        }

        context.visibleColumns = _.where(computed, { visible : true});

        // check if current columns config has displayed group headers.
        var hasHeaderGroups = false;
        for(var i=0; i< groups.length; i++) {
            var group = groups[i];
            var colspan = 0;
            for(var colIdx = group.fromColumn; colIdx <= group.toColumn; colIdx++) {
                if(computed[colIdx].visible) {
                    colspan++;
                }
            }
            if(colspan>0) {
                hasHeaderGroups = true;
                break;
            }
        }
        context.hasHeaderGroups = hasHeaderGroups;
    };

    ///////////
    // Row events
    ///////////

    var initializeRowEvents = function() {

        var eventScope = config.eventApplyScope || $scope;

        var previousHover = null;

        // row mouseenter
        ui.contentBody.delegate("tr", "mouseenter", function(event) {
            var row = $(event.currentTarget);
            if(config.hoverClass) {
                if(previousHover) {
                    previousHover.removeClass(config.hoverClass);
                }
                row.addClass(config.hoverClass);
                previousHover = row;
            }
            if(config.onRowEnter) {
                eventScope.$apply(function() {
                    config.onRowEnter(row.scope().model, row);
                });
            }
        });

        // row mouseleave
        ui.contentBody.delegate("tr", "mouseleave", function(event) {
            var row = $(event.currentTarget);
            if(config.hoverClass) {
                row.removeClass(config.hoverClass);
            }
            if(config.onRowLeave) {
                eventScope.$apply(function() {
                    config.onRowLeave(row.scope().model, row);
                });
            }
        });

        // row click + selection click
        ui.contentBody.delegate("tr", "click", function(event) {
            var row = $(event.currentTarget);
            var model = row.scope().model;
            if(config.onRowClick) {
                eventScope.$apply(function() {
                    config.onRowClick(model, row);
                });
            }
        });

    };

    var initializeRowSelection = function() {

        var selectionScope = config.selectionScope || $scope.$parent;
        var selectionAccessor = itUtils.createAccessor(selectionScope, config.selectionAttribute);

        var rowSelection = selectionAccessor();

        // row click + selection click
        ui.contentBody.delegate("tr", "click", function(event) {
            var row = $(event.currentTarget);
            var model = row.scope().model;
            selectionScope.$apply(function() {
                var currentSelection = selectionAccessor();
                if(currentSelection==model) {
                    return;
                }
                selectionAccessor(model);
            });
        });

        $scope.$watch(function() { return selectionAccessor(); }, function(selection) {
            rowSelection = selection;
        });

        ctrl.getRowSelection = function() {
            return rowSelection;
        }

    };

    //////////
    // HEADER FUNCS
    //////////

    var initializeHeaders = function() {
        constructColGroups();
        constructHeaders();
    };

    var constructColGroups = function() {
        ui.headColgroup.empty();
        ui.contentColgroup.empty();

        // var computedGroups = context.columns;
        _.each(context.visibleColumns, function(computed) {
            if(!computed.visible) {
                return;
            }
            computed.headerCol = $('<col>').appendTo(ui.headColgroup);
            computed.contentCol = $('<col>').appendTo(ui.contentColgroup);
        });
        // adds the scrollbar col
        $('<col class="scrollbar">').appendTo(ui.headColgroup);
        $('<col class="scrollbar">').appendTo(ui.contentColgroup);
    };

    var createHeadGroupRow = function() {
        var headerGroupRowLinker = linkers.headerGroupRow;
        var headerGroupRow = null;
        headerGroupRowLinker($scope, function(_headerGroupRow) {
            headerGroupRow = _headerGroupRow;
            headerGroupRow.prependTo(ui.headTable.find('thead'));
        });
        return headerGroupRow;
    };

    var createHeadHeaderRow = function() {
        var headerRowLinker = linkers.headerRow;
        var headerRow = null;
        headerRowLinker($scope, function(_headerRow) {
            headerRow = _headerRow;
            headerRow.appendTo(ui.headTable.find('thead'));
        });
        return headerRow;
    };

    var columnsParentScope= null;

    var constructHeaders = function() {

        if(columnsParentScope!=null) {
            columnsParentScope.$destroy();
            ui.headTable.find('thead').empty();
            ui.contentHeadRow.empty();
        }

        columnsParentScope = $scope.$new();

        // var computedColumns = context.columns;
        var hasGroups = context.hasHeaderGroups;

        var headerRow = createHeadHeaderRow();
        var headerCellLinker = linkers.headerCell;
        var contentHeaderCellLinker = linkers.contentHeaderCell;

        var headerGroupRow,
            groupCellLinker,
            lastGroup = null;

        if(hasGroups) {
            headerGroupRow = createHeadGroupRow();
            groupCellLinker = linkers.headerGroupCell;
        }

        _.each(context.visibleColumns, function(computed) {

            var group = computed.group;
            var column = computed.column;

            var columnScope = columnsParentScope.$new();
            columnScope.column = computed;

            // add group row cell if necessary
            if(group && group != lastGroup) {
                lastGroup = group;

                // calculating effective colspan ( visible = false )
                var colspan = 0;
                for(var colIdx = group.fromColumn; colIdx <= group.toColumn; colIdx++) {
                    if(context.columns[colIdx].visible) {
                        colspan++;
                    }
                }

                groupCellLinker($scope, function(headerCell) {
                    headerCell.text(group.title);
                    headerCell.attr("colspan", colspan);
                    headerCell.appendTo(headerGroupRow);
                });
            }

            // add header row cell
            headerCellLinker(columnScope, function(headerCell) {

                computed.headerInjector(headerCell, columnScope);

                // headerCell.text(column.title);

                if(column.headerClass) {
                    headerCell.addClass(column.headerClass);
                }
                computed.headerCell = headerCell;

                if(hasGroups && group==null) {
                    headerCell.attr("rowspan", 2);
                    headerCell.appendTo(headerGroupRow);
                } else {
                    headerCell.appendTo(headerRow);
                }
            });

            // add content header cell
            contentHeaderCellLinker(columnScope, function(contentHeaderCell) {

                // TODO : find a way to copy header cell styles ( + content maybe ? )

                computed.headerInjector(contentHeaderCell, columnScope);

                // contentHeaderCell.text(column.title);
                ui.contentHeadRow.append(contentHeaderCell);
            });
        });

        $('<th class="scrollbar"</th>')
            .attr("rowspan", hasGroups ? 2 : 1)
            .appendTo(hasGroups ? headerGroupRow : headerRow);

        ui.contentHeadRow.append($('<th class="scrollbar"></th>'));
        ui.contentHeadRow.hide();
    };

    ctrl.sortBy = function(columnIndex, desc) {
        var column = _.findWhere(context.columns, { index : columnIndex });

        itSortFactory.sort(dataSource, column.column, desc);
        _refreshContent(config.keepIndexOnSort);

        // console.log("sorting by :", column.index, desc, _.pluck(dataSource, "id"));

        context.sort = {
            column  : column.index,
            desc    : desc
        }
    };

    ///////////
    // COLUMN WIDTH SIZING
    //////////

    var showContentHeaders = function() {
        ui.contentHeadRow.show();
    };

    var hideContentHeaders = function() {
        ui.contentHeadRow.hide();
    };

    //////////////
    // COLUMNS VISIBILITY
    //////////////

    // TODO : choose which method to keep

    ctrl.toggleColumnVisibility = function(columnIdx, visible) {
        var column = _.findWhere(context.columns, { index : columnIdx });
        column.column.visible = arguments.length == 2 ? visible : !column.visible;

        computeColumns();
        initializeHeaders();
        _refreshContent(true);
    };

    ctrl.toggleColumnsVisibility = function(columnList, visible) {

        _.each(columnList, function(columnIdx) {
            var column = _.findWhere(context.columns, { index : columnIdx });
            column.column.visible = arguments.length == 2 ? visible : !column.visible;
        });

        computeColumns();
        initializeHeaders();
        _refreshContent(true);
    };

    ctrl.setColumnVisibility = function(columnIdx, visible) {
        var column = _.findWhere(context.columns, { index : columnIdx });
        column.column.visible = visible;
        computeColumns();
        initializeHeaders();
        _refreshContent(true);
    };

    ctrl.setColumnsVisibility = function(columnMap) {
        _.each(columnMap, function(visible, columnIdx) {
            var column = _.findWhere(context.columns, { index : columnIdx });
            column.column.visible = visible;
        });

        computeColumns();
        initializeHeaders();
        _refreshContent(true);
    };

    ctrl.getColumnGroups = function() {
        return config.columnGroups;
    };

    ctrl.getColumnsVisibility = function() {
        var map = {};
        _.each(context.columns, function(column, idx) {
            map[idx] = column.visible;
        });
        return map;
    };

    ctrl.setGroupVisibility = function(groupId, visible) {
        var group = _.findWhere(config.columnGroups, { id : groupId });
        ctrl.toggleColumnsVisibility(group.columns, visible);
    };

    ////////


    var computeColumnSizing = function() {

        var showScrollbar = context.pagination.full !== true;

        var computedColumns = context.visibleColumns;


        var totalWidth = ui.contentDiv.width();
        var scrollbarWidth = config.scrollbarWidth;
        var availableWidth = totalWidth;

        if(showScrollbar) {
            availableWidth -= scrollbarWidth;
        }

        var setColumnWidth = function(index, width) {
            computedColumns[index].headerCol.width(width);
            computedColumns[index].contentCol.width(width);
        };

        var requireAutosizing = false;

        // sizing the scrollbar column
        if(showScrollbar) {
            scrollbar.show();
            ui.headColgroup.find(".scrollbar").width(scrollbarWidth);
            ui.contentColgroup.find(".scrollbar").width(scrollbarWidth);
        } else {
            scrollbar.hide();
            ui.headColgroup.find(".scrollbar").width(0);
            ui.contentColgroup.find(".scrollbar").width(0);
        }

        _.each(computedColumns, function(computedColumn, i) {

            /*
             if(!computedColumn.visible) {
             computedColumn.autowidth = false;
             return;
             }
             */

            var width = computedColumn.column.width || "auto";
            var widthInPixel = null;

            if(_.isNumber(width)) {
                widthInPixel = width;
            } else if(/px$/i.test(width)) {
                widthInPixel = parseInt(width.substring(0, width.length - 2));
            } else if(/%$/i.test(width)) {
                var percentage = parseInt(width.substring(0, width.length -1));
                widthInPixel = percentage * totalWidth / 100;
            } else {
                // auto
                requireAutosizing = true;
            }

            if(widthInPixel != null) {
                availableWidth -= widthInPixel;
                computedColumn.autowidth = false;
                computedColumn.width = widthInPixel;
                setColumnWidth(i, widthInPixel);
            } else {
                setColumnWidth(i, "");
                computedColumn.autowidth = true;
            }
        });

        if(requireAutosizing) {

            // console.log("require auto sizing !");

            ui.contentTable.css({ "table-layout" : "auto"});
            showContentHeaders();

            _.each(computedColumns, function(computedColumn, i) {
                if(!computedColumn.autowidth) {
                    return;
                }
                var columnWidth = ui.contentTable.find("thead th").eq(i).width();
                setColumnWidth(i, columnWidth);
            });

            ui.contentTable.css({ "table-layout" : "fixed" });
            hideContentHeaders();
        }

    };


    ctrl.refreshColumnsSizing = function() {
        computeColumnSizing();
    };

    //////////
    // HEIGHT SIZING
    //////////

    ctrl.setHeight = function(height, redraw) {

        context.maxHeight = height;

        if(redraw && dataSource) {

            applyMaxAvailableHeight();
            ctrl.scroll.toIndex(context.pagination && context.pagination.first || 0);
            computeColumnSizing();
            scrollbar.refresh(true);
            applyUsedHeight();
        }
    };

    // used before appending rows to know the height limit.
    var applyMaxAvailableHeight = function() {
        var headHeight = ui.headDiv.height();
        var contentHeight = context.maxHeight - headHeight -1; // TODO : might want to compute this only once. (+ compute border instead of hardcoded -1)
        ui.contentDiv.height(contentHeight+ "px");
    };

    var applyUsedHeight = function() {
        var filled = context.pagination.filled;
        var full = context.pagination.full;
        if(filled && !full) {
            applyMaxAvailableHeight();
        } else {
            ui.contentDiv.height(ui.contentTable.height());
        }
    };

    //////////
    /// SCROLL
    //////////

    ctrl.scroll = {
        toIndex : function(index) {
            setScrollPosition(index);
        },
        toTop : function() {
            setScrollPosition(0);
        },
        toBottom : function() {
            setScrollPosition(dataSource.length-1);
        },
        toPercent : function(percent) {
            var itemIdx = Math.round((percent / 100) * (dataSource.length - context.pagination.count));
            setScrollPosition(itemIdx);
        },
        pageUp : function() {
            ctrl.scroll.offset(-(context.pagination.count-1));
        },
        pageDown : function() {
            ctrl.scroll.offset(context.pagination.count-1);
        },
        offset : function(count) {
            if( (count < 0) ? (firstIdx == 0) : (lastIdx == dataSource.length -1 ) ) {
                return false;
            }
            var scrollTo = (count > 0) ?  Math.min(firstIdx + count, dataSource.length -1) : Math.max(firstIdx + count, 0);
            setScrollPosition(scrollTo);
            return true;
        }
    };

    //////////
    /// RENDER
    //////////

    var originalDataSource = null;
    var dataSource = [];
    var firstIdx, lastIdx;
    // var rendered = false;

    var displayedRows = [];
    var renderedRows = [];

    var clearRenderedRows = function(reinit) {
        var row;
        for(var i=0; i<renderedRows.length; i++) {
            row = renderedRows[i];
            if(row) {
                row.scope().$destroy();
                row.remove();
            }
        }
        if(reinit) {
            renderedRows = new Array(dataSource.length);
        }
    };

    ctrl.setDatasource = function(_dataSource) {
        originalDataSource = _dataSource;
        dataSource = originalDataSource.slice(0);

        if(config.initialSort) {
            var sort = config.initialSort;
            var columnIdx, desc;
            if(_.isNumber(sort)) {
                columnIdx = sort;
                desc = false;
            } else if(_.isArray(sort)) {
                columnIdx = sort[0];
                desc = (sort[1] == true || sort[1] == "desc");
            }
            ctrl.sortBy(columnIdx, desc);
        }

        _refreshContent(false);
    };

    var _refreshContent = function(keepIndex) {
        var initialIndex = keepIndex ? firstIdx : getInitialScroll();
        clearRenderedRows(true);
        applyMaxAvailableHeight();
        ctrl.clearRenderState();
        setScrollPosition(initialIndex, true);
        computeColumnSizing();
        applyUsedHeight();
        scrollbar.refresh(true);
    };

    var getInitialScroll = function() {
        var initialScroll = config.initialScroll;
        if(_.isFunction(initialScroll)) {
            initialScroll = initialScroll(dataSource);
        }
        if(_.isNumber(initialScroll)) {
            return initialScroll;
        } else if(_.isObject(initialScroll)) {
            return _.indexOf(dataSource, initialScroll);
        } else {
            return 0;
        }
    };

    ctrl.clearRenderState = function() {
        firstIdx = undefined;
        lastIdx = undefined;
        // rendered = false;
        context.pagination =  {};
        displayedRows = [];
        ui.contentBody.empty();
    };

    var setScrollPosition = function(index, initial) {

        // var startTime = new Date().getTime(); // todo remove

        // var previousFirst = firstIdx;
        // var previousLast = lastIdx;
        var previousDisplayed = displayedRows;

        /*
         var isInPreviousRange = function(idx) {
         return (idx >= previousFirst) && (idx <= previousLast);
         };

         var isInNewRange = function(idx) {
         return (idx >= firstIdx) && (idx <= lastIdx);
         };
         */

        _.each(previousDisplayed, function(row, i) {
            row.detach();
        });

        // hyjacking when empty dataSource
        if(!dataSource || !dataSource.length) {
            return;
        }

        // console.log("*** rendering. previousFirst = " + previousFirst +" previousLast = " +  previousLast);

        firstIdx = index;
        // var offset = firstIdx - previousFirst;
        var i = 0;
        displayedRows = [];
        var currentIdx = firstIdx;
        var filled = false;
        var nextRow;
        var contentDivHeight = ui.contentDiv.height();

        do {

            // console.log("i = " + i + " -> table : " + ui.contentTable.height() + "  - div :  " + ui.contentDiv.height() );

            // console.log("** row");
            // console.log("- i = " +i + ", rowIndex = " + currentIdx);
            // console.log("- isInPreviousRange -> ", isInPreviousRange(currentIdx));


            nextRow = ctrl.getOrCreateRow(currentIdx).show().appendTo(ui.contentBody);

            /*
             if(isInPreviousRange(currentIdx)) {
             nextRow = previousDisplayed[offset+i];
             nextRow.show().appendTo(ui.contentBody);
             } else {
             nextRow = ctrl.createRow(currentIdx, false);
             }
             */

            displayedRows.push(nextRow);

            filled = ui.contentTable.height() >= contentDivHeight;

            // initial draw -> we need to double check that column sizing is correct before assuming table is filled.
            if(initial && filled) {
                computeColumnSizing();
                filled = ui.contentTable.height() >= contentDivHeight;
            }

            i++;
            currentIdx++;

            // console.log("-  filled " + ui.contentTable.height() + " of " + ui.contentDiv.height());

        } while(!filled && (currentIdx < dataSource.length));

        lastIdx = currentIdx - 1;


        // console.log("before reverse : filled from " + firstIdx + " to " + lastIdx);

        // not filled : we were at the end of the table. need to reverse fill when possible
        if(!filled && (firstIdx > 0) ) {

            // console.log("*** REVERSE FILL !");

            var previousRow;
            currentIdx = firstIdx - 1;
            i = 0;

            do {
                // console.log("currentIdx = " + currentIdx + " -> inPreviousRange -> " + isInPreviousRange(currentIdx));

                previousRow = ctrl.getOrCreateRow(currentIdx).show().prependTo(ui.contentBody);

                /*
                 if(isInPreviousRange(currentIdx)) {
                 previousRow = previousDisplayed[offset-1-i];
                 previousRow.show().prependTo(ui.contentBody);
                 } else {
                 previousRow = ctrl.createRow(currentIdx, true);
                 }
                 */

                displayedRows.splice(0, 0, previousRow);


                filled = ui.contentTable.height() >= ui.contentDiv.height();
                i++;
                currentIdx--;

            } while(!filled && (currentIdx > -1));

            firstIdx = currentIdx + 1;

            // console.log("after reverse : filled from " + firstIdx + " to " + lastIdx);

        }

        if(filled && (lastIdx == dataSource.length-1)) {
            var tableOffset = ui.contentTable.height() - ui.contentDiv.height();
            ui.contentTable.css({ bottom : tableOffset + "px" });
        } else {
            ui.contentTable.css({ bottom : "0px" });
        }


        // resizing -> required ?
        // computeColumnSizing();

        // rendered = true;

        context.pagination = {
            first   : firstIdx,
            last    : lastIdx,
            count   : lastIdx - firstIdx + 1,
            total   : dataSource.length,
            filled  : filled,
            full    : (firstIdx == 0) && (lastIdx == dataSource.length - 1)
        };

        scrollbar.refresh();
        resetRowManagement();   // TODO : add debounce / throttle on managemennt process restart

        if(config.onScrollChange) {
            config.onScrollChange(context.pagination, dataSource)
        }

        //var endTime = new Date().getTime();
        //var duration = (endTime - startTime);
        // console.log("table redraw in " + duration + "ms");
    };


    ///////
    // ROW CREATION
    ///////

    ctrl.getOrCreateRow = function(i) {
        return renderedRows[i] || ctrl.createRow(i, false);
    };

    ctrl.createRow = function(i, detach) {

        // console.log("creating row for index = ", i);

        var rowModel = dataSource[i];
        var rowScope = $scope.$new();
        rowScope.model = rowModel;
        rowScope.$index = i;
        var row = null;
        linkers.row(rowScope, function(_row) {
            row = _row;
            ui.contentBody.append(row);
        });
        renderedRows[i] = row;
        if(detach) {
            row.detach();
        }
        return row;
    };

    ctrl.deleteRow = function(i) {

        // console.log("deleting row for index = ", i);

        var row = renderedRows[i];
        if(!row) {
            return;
        }
        row.scope().$destroy();
        row.remove();
        renderedRows[i] = null;
    };

    ///////////
    // GETTER
    //////////

    ctrl.getContext = function() {
        return context;
    };

    ctrl.getConfig = function() {
        return config;
    };

    ctrl.getScope = function() {
        return $scope;
    };

    /////////////// TODO

    var rowManagementIntervalId = null;
    var rowPrecompilationQueue = [];

    var resetRowManagement = function() {
        stopRowManagementProcess();
        startRowManagementProcess();
    };

    var stopRowManagementProcess = function() {
        $window.clearInterval(rowManagementIntervalId);
        rowManagementIntervalId = null;
    };

    var startRowManagementProcess = function() {
        rowPrecompilationQueue = null;
        rowManagementIntervalId = $window.setInterval(rowManagementCycle, config.rowManagementCycleInterval)
    };

    var rowManagementCycle = function() {
        if(rowPrecompilationQueue==null) {
            rowPrecompilationQueue = computePrecompilationQueue();
        }

        // console.log("precompute list = ", rowPrecompilationQueue);

        if(rowPrecompilationQueue.length) {
            var count = 0;
            do {
                precompileNextRow();
            } while((rowPrecompilationQueue.length) && (++count < config.rowPerManagementCycle));
        } else {
            var watcherCount = itUtils.countWatchers(config.countRootWatchers ? $rootScope : $scope);

            // console.log("cleanup : watcher count = ", watcherCount);

            if(watcherCount > config.maxWatchers) {
                removeNextUnusedRows();
            } else {
                stopRowManagementProcess();
            }
        }
    };

    var computePrecompilationQueue = function() {

        var pagination = context.pagination;

        if(!pagination.filled) {
            return [];
        }

        var precompilationList = [];

        var pageCount = config.preloadedPageCount;
        var rowCount = pageCount * pagination.count;
        var nextIdx = pagination.last +1;
        var i = 0;

        while( (nextIdx < pagination.total) && (i < rowCount) ) {
            if(renderedRows[nextIdx] == null) {
                precompilationList.push(nextIdx);
            }
            nextIdx++;
            i++;
        }

        // TODO : also add previous pages

        return precompilationList;
    };

    var removeNextUnusedRows = function() {

        var pagination = context.pagination;
        var pageCount = config.preloadedPageCount;
        var rowCount = pageCount * pagination.count;

        var firstIdx = Math.max(pagination.first - (pageCount * rowCount), 0);
        var lastIdx = Math.min(pagination.last + (pageCount * rowCount), pagination.total - 1);

        // console.log("dont touch from " + firstIdx + " to " + lastIdx);

        var removalCount = 0;
        for(var i=0; i<renderedRows.length; i++) {
            if( (i >= firstIdx) && (i <= lastIdx)) {
                continue;
            }
            if(renderedRows[i] != null) {
                ctrl.deleteRow(i);
                removalCount++;
            }
            if(removalCount >= config.rowPerManagementCycle) {
                break;
            }
        }
    };

    var precompileNextRow = function() {
        var nextId = rowPrecompilationQueue[0];
        ctrl.createRow(nextId, true);
        rowPrecompilationQueue.splice(0, 1);
    };

    // cleanup / disposal

    ctrl.dispose = function() {
        clearRenderedRows();
    }

});

itModule.directive('infiniTable', function (itTableRegistry, itUtils) {

    var keyCodes = itUtils.keyCodes;

    return {
        restrict : "E",
        replace  : true,
        scope    : true,
        template : '' +
            '<div class="infini-table" tabindex="0">' +
            '   <div class="it-head">' +
            '       <table class="it-head-table">' +
            '           <colgroup></colgroup>' +
            '           <thead></thead>' +
            '       </table>' +
            '   </div>' +
            '   <div class="it-body">' +
            '       <table class="it-body-table">' +
            '           <colgroup></colgroup>' +
            '           <thead>' +
            '               <tr></tr>' +
            '           </thead>' +
            '           <tbody></tbody>' +
            '       </table>' +
            '       <div it-scroll-bar></div>' +
            '   </div>' +
            '</div>',
        controller : "InfiniTableController",
        link : function($scope, $el, $attrs, ctrl) {

            var unwatchConfig,
                unwatchSource,
                unregisterTable;

            $attrs.$observe("tableConfig", function(tableConfigPropName) {

                initializeTableEvent();

                unwatchConfig = $scope.$parent.$watch(tableConfigPropName, function(tableConfig) {
                    if(tableConfig==null) {
                        return;
                    }
                    setTableConfig(tableConfig);
                });
            });

            var setTableConfig = function(config) {
                if(!config.id) {
                    config.id = _.uniqueId("infiniTable-");
                }
                ctrl.initializeTable(config);

                unregisterTable && unregisterTable();
                unregisterTable = itTableRegistry.register(config.id, ctrl);

                // stop previous source watcher if exists;
                unwatchSource && unwatchSource();

                // watch & observe dataSource
                unwatchSource = $scope.$parent.$watch(config.source, function(dataSource) {
                    if(!dataSource) {
                        return;
                    }
                    ctrl.setDatasource(dataSource);
                });
            };

            var initializeTableEvent = function() {

                // mousewheel scroll
                $el.mousewheel(function(event) {
                    $scope.$apply(function() {
                        var deltaY = event.deltaY;
                        var scrolled = ctrl.scroll.offset(deltaY > 0 ? -1 : 1);
                        if(scrolled) {
                            event.preventDefault();
                        }
                    });
                });

                // keypress listener
                $el.keydown(function(event) {
                    // TODO : prevent default if action success ( see mousewheel scroll )
                    $scope.$apply(function() {
                        switch(event.which) {
                            case keyCodes.UP : {
                                return ctrl.scroll.offset(-1);
                            }
                            case keyCodes.DOWN : {
                                return ctrl.scroll.offset(1);
                            }
                            case keyCodes.PAGE_UP : {
                                return ctrl.scroll.pageUp();
                            }
                            case keyCodes.PAGE_DOWN : {
                                return ctrl.scroll.pageDown();
                            }
                        }
                    });
                });

                var debouncedColumnSizing = _.debounce(function() {
                    $scope.$apply(function() {
                        ctrl.refreshColumnsSizing();
                    })
                }, 100);

                $scope.$on("$resize:required", debouncedColumnSizing);
            };

            // ctrl cleanup on $destroy
            $scope.$on("$destroy", function() {
                ctrl.dispose();
                unregisterTable && unregisterTable();
                unwatchConfig && unwatchConfig();
                unwatchSource && unwatchSource();
            });

        }
    }
});


/**
 * it-header-cell
 */
itModule.directive('itHeaderCell', function () {
    return {
        restrict : "A",
        require : "^infiniTable",
        scope : true,
        link : function($scope, $el, $attrs, tableCtrl) {

            var column = $scope.column;

            if(column.sortable) {
                var context = tableCtrl.getContext();
                $el.addClass("it-sortable-column");
                $el.click(function() {
                    $scope.$apply(function() {
                        var isSortColumn = (column.index == context.sort.column);
                        tableCtrl.sortBy(column.index, isSortColumn ? !context.sort.desc : false);
                    });
                });

                var sortIcon = $("<i>").addClass("it-sort").appendTo($el);

                $scope.$watch(function() { return context.sort; }, function(sort) {
                    if(sort.column==column.index) {
                        sortIcon.addClass("it-sorted-by");
                        if(sort.desc) {
                            sortIcon.removeClass("it-sort-asc").addClass("it-sort-desc");
                        } else {
                            sortIcon.removeClass("it-sort-desc").addClass("it-sort-asc");
                        }
                    } else {
                        sortIcon.removeClass("it-sorted-by it-sort-asc it-sort-desc");
                    }
                });
            }
        }
    }
});

/**
 * IT Body Row
 */
itModule.directive('itRow', function ($compile, $interpolate, itUtils) {
    return {
        restrict : "A",
        require : "^infiniTable",
        scope : true,
        link : function($scope, $el, $attrs, tableCtrl) {

            var context = tableCtrl.getContext(),
                config  = tableCtrl.getConfig(),
                model   = $scope.model;

            // row selection

            if(config.allowSelection) {
                $el.addClass("it-selectable-row");

                $scope.$watch(function() { return tableCtrl.getRowSelection(); }, function(selection) {
                    if(selection==model) {
                        $el.addClass("it-selected");
                    } else {
                        $el.removeClass("it-selected");
                    }
                });
            }

            // row construction

            var constructRow = function() {

                // creating cells
                _.each(context.columns, function(computed) {
                    if(!computed.visible) {
                        return;
                    }
                    var cellInjector = computed.cellInjector;
                    cellInjector($el, $scope);
                });

                // adding scrollbar cell
                $('<td class="scrollbar"></td>').appendTo($el);

                // force digest of the row scope to interpolate values.
                // needed for height calculation)
                itUtils.applyWatchers($scope);
            };

            // perform initialisation

            constructRow();

        }
    }
});

/**
 * IT Scrollbar
 */
itModule.directive('itScrollBar', function ($window) {
    return {
        restrict : "EA",
        scope : true,
        require : ["itScrollBar", "^infiniTable"],
        replace : true,
        template :
            '<div class="it-scrollbar">' +
                '   <div class="it-sb-btn it-sb-btn-up">&#9650;</div>' +
                '   <div class="it-sb-track">' +
                '       <div class="it-sb-thumb"></div>' +
                '   </div>' +
                '   <div class="it-sb-btn it-sb-btn-down">&#9660;</div>' +
                '</div>',
        link : function($scope, $el, $attrs, controllers) {

            var ctrl = controllers[0];
            var tableCtrl = controllers[1];

            tableCtrl.$setScrollbarCtrl(ctrl);
            ctrl.$setTableCtrl(tableCtrl);
        },
        controller : function($scope, $element) {

            var ctrl = this,
                computed = false,
                context = null,
                isDragging = false,
                tableCtrl = null,
                $el = $element ;

            var btnUp   = $el.find(".it-sb-btn-up"),
                track   = $el.find(".it-sb-track"),
                thumb   = $el.find(".it-sb-thumb"),
                btnDown = $el.find(".it-sb-btn-down");

            ctrl.$setTableCtrl = function(_tableCtrl) {
                tableCtrl = _tableCtrl;
                context = tableCtrl.getContext();
            };

            ctrl.hide = function() {
                $el.hide();
            };

            ctrl.show = function() {
                $el.show();
            };

            var trackHeight = null,
                thumbHeight = null;

            var computeHeights = function() {

                var config = tableCtrl.getConfig();

                // track

                trackHeight = track.innerHeight();

                // thumb

                var ratio = context.pagination.count / context.pagination.total;
                thumbHeight = Math.floor(trackHeight * ratio);

                if(config.scrollbarThumbMinHeight && config.scrollbarThumbMinHeight > thumbHeight) {
                    thumbHeight = config.scrollbarThumbMinHeight;
                }
                if(config.scrollbarThumbMaxHeight && config.scrollbarThumbMaxHeight < thumbHeight) {
                    thumbHeight = config.scrollbarThumbMaxHeight;
                }

                thumb.height(thumbHeight);
                computed = true;
            };

            ctrl.refresh = function(recompute) {

                if(recompute || !computed) {
                    computeHeights();
                }

                var pagination = context.pagination;

                // thumb position
                if(!isDragging) {
                    var height = trackHeight - thumbHeight;
                    var percentage = pagination.first / (pagination.total - pagination.count);
                    var offset = height * percentage;
                    setThumbPosition(offset);
                }

                // thumb
                if(pagination.filled) {
                    thumb.show();
                } else {
                    thumb.hide();
                }

                // btn up
                if(pagination.first===0) {
                    btnUp.addClass("disabled");
                } else {
                    btnUp.removeClass("disabled");
                }

                // btn down
                if(pagination.last === (pagination.total-1)) {
                    btnDown.addClass("disabled");
                } else {
                    btnDown.removeClass("disabled");
                }
            };

            // thumb dragging

            var setThumbPosition = function(pos) {
                thumb.css({ top : pos });
            };

            thumb.draggable({
                containment: "parent",
                axis: "y",
                start: function(e, ui) {
                    isDragging = true;
                },
                drag: function(e, ui) {
                    var offset = ui.position.top;
                    var height = track.innerHeight() - thumb.height();
                    var percentage = offset * 100 / height;
                    $scope.$apply(function() {
                        tableCtrl.scroll.toPercent(percentage);
                    });
                },
                stop: function(e) {
                    isDragging = false;
                }
            });

            // track click

            track.mousedown(function(event) {
                if(thumb.is(event.target)) {
                    return;
                }

                var intervalId;
                var clickOffset = event.offsetY;
                var thumbPosition = thumb.position().top;

                var reverse = thumbPosition > clickOffset;

                var clearInterval = function() {
                    $window.clearInterval(intervalId);
                };

                var scrollPage = function() {
                    $scope.$apply(function() {
                        reverse ? tableCtrl.scroll.pageUp() : tableCtrl.scroll.pageDown();
                    });
                };

                var mouseUpHandler = function() {
                    clearInterval();
                    $($window).unbind("mouseup", mouseUpHandler);
                };

                scrollPage();
                intervalId = $window.setInterval(function() {
                    thumbPosition = thumb.position().top;
                    if(reverse ? thumbPosition < clickOffset : thumbPosition > clickOffset) {
                        mouseUpHandler();
                        return;
                    }
                    scrollPage();
                }, 100);
                $($window).mouseup(mouseUpHandler);
            });

            // btnUp / btnDown click

            var initIntervalScroll = function(reverse) {
                var intervalId;

                var clearInterval = function() {
                    $window.clearInterval(intervalId);
                };

                var scrollTick = function() {
                    $scope.$apply(function() {
                        tableCtrl.scroll.offset(reverse ? -1 : 1);
                    });
                };

                var startIntervalScroll = function() {
                    scrollTick();
                    intervalId = $window.setInterval(function() {
                        scrollTick();
                    }, 100);
                };

                var mouseUpHandler = function() {
                    clearInterval();
                    $($window).unbind("mouseup", mouseUpHandler);
                };

                return function() {
                    startIntervalScroll();
                    $($window).mouseup(mouseUpHandler);
                }
            };

            btnUp.mousedown(initIntervalScroll(true));
            btnDown.mousedown(initIntervalScroll(false));

        }
    }
});





