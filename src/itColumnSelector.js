'use strict';

itModule.directive("itColumnSelector", function(itTableRegistry) {
    return {
        restrict : "E",
        replace  : true,
        scope    : true,
        template : '' +
            '<div class="it-column-selector" tl-dropdown>' +
            '   <a class="it-cs-btn" tl-dropdown-toggle>' +
            '       <i class="fa fa-columns"></i>' +
            '       <span>Gestion des colonnes</span>' +
            '   </a>' +
            '   <div class="it-cs-menu" tl-dropdown-menu>' +
            '       <div class="it-cs-group" ng-repeat="group in columnGroups" ng-click="toggleGroup(group)">' +
            '           <span>{{group.title}}</span>' +
            '           <input type="checkbox" ng-checked="isGroupVisible(group)">' +
            '       </div>' +
            '   </div>' +
            '</div>',
        link     : function($scope, $el, $attrs, ctrl) {

            $attrs.$observe("tableId", function(tableId) {
                var unwatch = $scope.$watch(
                    function() {
                        return itTableRegistry.getController(tableId);
                    },
                    function(tableController) {
                        if(!tableController) {
                            return;
                        }
                        unwatch();
                        ctrl.setTableController(tableController);
                    }
                );
            });

        },
        controller : function($scope) {

            var ctrl = this,
                tableCtrl = null;

            $scope.menuOpened = false;
            $scope.columnGroups = [];

            ctrl.setTableController = function(_tableCtrl) {
                tableCtrl = _tableCtrl;
                $scope.columnGroups = tableCtrl.getColumnGroups(); // TODO : watch ?
            };

            $scope.toggleMenu = function() {
                $scope.menuOpened = !$scope.menuOpened;
            };

            $scope.toggleGroup = function(group) {
                tableCtrl.setGroupVisibility(group.id, !$scope.isGroupVisible(group));
            };

            $scope.isGroupVisible = function(group) {

                var visibilityMap = tableCtrl.getColumnsVisibility();
                var visible = true;
                for(var i = 0; i<group.columns.length; i++) {
                    if(visibilityMap[group.columns[i]] == false) {
                        visible = false;
                        break;
                    }
                }
                return visible;
            }

        }
    }
});
