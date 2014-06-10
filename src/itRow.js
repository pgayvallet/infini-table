'use strict';


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