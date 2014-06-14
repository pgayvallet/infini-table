'use strict';

var demoModule = angular.module("it-demo", ["infiniTable", "ngRoute"]);

demoModule.controller("DemoPageController", function($scope) {

    $scope.test = "lala";

});

demoModule.config(function ($routeProvider, $locationProvider) {

    $routeProvider
        .when('/home', {
            controller: "HelloTableDemoController",
            templateUrl : "/demos/hello-table/hello-table.html"
        })
        .otherwise({
            redirectTo: '/home'
        });

    $locationProvider.html5Mode(false);
});