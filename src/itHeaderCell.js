'use strict';

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