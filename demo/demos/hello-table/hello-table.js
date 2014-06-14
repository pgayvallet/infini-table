'use strict';

demoModule.controller("HelloTableDemoController", function($scope) {

    var source = $scope.mySource = [];
    _.times(50, function(i) {

        source.push({
            id : i,
            name : "Row " + i
        })

    });

    $scope.tableConfig = {
        source : "mySource",

        columns : [
            {
                title : "Id",
                attribute : "id"
            },
            {
                title : "Name",
                attribute : "name"
            },
            {
                title : "Comment",
                expression : "row number {{$index}}"
            }
        ]
    };

});
