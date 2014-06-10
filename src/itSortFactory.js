'use strict';

define("taelys.common", function() {

    // TODO : register sort methods to the factory

    var module = angular.module("taelys.common");

    module.factory("itSortFactory", function() {

        // TODO : factory

        var stringComparator = function(attr) {
            return function(a, b) {
                var attrA = (a[attr] || "").toLowerCase();
                var attrB = (b[attr] || "").toLowerCase();
                return attrA < attrB ? -1 : attrA > attrB ? 1 : 0;
            }
        };

        var numberComparator = function(attr) {
            return function(a, b) {
                return a[attr] < b[attr] ? -1 : a[attr] > b[attr] ? 1 : 0;
            }
        };

        var dateComparator = function(attr) {
            return function(a, b) {
                return a[attr] < b[attr] ? -1 : a[attr] > b[attr] ? 1 : 0;
            }
        };

        var montantComparator = function(attr) {
            return function(a, b) {
                return a[attr].valeur < b[attr].valeur ? -1 : a[attr].valeur > b[attr].valeur ? 1 : 0;
            }
        };

        var booleanComparator = function(attr) {
            return function(a, b) {
                return a[attr] < b[attr] ? -1 : a[attr] > b[attr] ? 1 : 0;
            }
        };

        var comparators = {
            boolean : booleanComparator,
            string  : stringComparator,
            number  : numberComparator,
            montant : montantComparator,
            date    : dateComparator
        };

        return {

            sort : function(dataSource, column, reverse) {

                var typeOrFunc = column.sortType || "string";

                var sortMethod;
                if(_.isFunction(typeOrFunc)) {
                    sortMethod = typeOrFunc
                } else {
                    var comparatorBuilder = comparators[typeOrFunc];
                    sortMethod = comparatorBuilder(column.attribute);
                }

                // console.log("sortMethod = ", column.attribute, reverse);

                dataSource.sort(sortMethod);
                if(reverse) {
                    dataSource.reverse();
                }
            }

        }

    });

});