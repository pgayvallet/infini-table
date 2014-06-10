describe('Directive : infiniTable', function () {

    beforeEach(module('taelys.common'));

    var $compile,
        $document,
        $rootScope,
        $scope,
        table,
        ctrl,
        ui;

    beforeEach(inject(function ($injector) {
        $compile = $injector.get("$compile");
        $rootScope = $injector.get("$rootScope");
        $document = $injector.get("$document");

        $scope = $rootScope.$new();
    }));

    afterEach(function() {
        $scope && $scope.$destroy();
        table && table.remove();
    });

    var compileTable = function() {
        var linkFn = $compile('<infini-table table-config="config"></infini-table>');
        linkFn($scope, function(_table) {
            table = _table;
            table.appendTo(document.body);
        });
        ctrl = table.controller("infiniTable");
        ui = {
            headDiv         : table.find(".it-head"),
            headTable       : table.find(".it-head table"),
            headColgroup    : table.find(".it-head table colgroup"),
            contentDiv      : table.find(".it-body"),
            contentTable    : table.find(".it-body table"),
            contentColgroup : table.find(".it-body table colgroup"),
            contentHead     : table.find(".it-body table thead"),
            contentHeadRow  : table.find(".it-body table thead tr"),
            contentBody     : table.find(".it-body table tbody")
        };
        $scope.$digest();
    };

    var getRow = function(rowIdx) {
        return ui.contentBody.find("tr").eq(rowIdx);
    };

    var getCell = function(rowIdx, cellIdx) {
        return getRow(rowIdx).find("td").eq(cellIdx);
    };

    var getCellValue = function(rowIdx, cellIdx) {
        return getCell(rowIdx, cellIdx).text();
    };

    describe("using basic configuration", function() {

        var generateDummySource = function(length) {
            var data = [];
            _.times(length, function(i) {
                data.push({
                    id    : i,
                    label : "model " + i,
                    value : "10" + i
                });
            });
            return $scope.data = data;
        };

        it('should display rows according to configuration', function () {

            var data = generateDummySource(3);

            $scope.config = {
                source : "data",
                columns: [
                    {
                        title: "ID",
                        attribute: "id"
                    },
                    {
                        title: "LABEL",
                        attribute: "label"
                    },
                    {
                        title: "VALUE",
                        attribute: "value"
                    }
                ]
            };
            compileTable();

            expect(ui.contentBody.find("tr").length).toBe(3);

            var assertRow = function(rowIdx) {
                expect(getCellValue(rowIdx, 0)).toBe("" + rowIdx);
                expect(getCellValue(rowIdx, 1)).toBe("model " + rowIdx);
                expect(getCellValue(rowIdx, 2)).toBe("10" + rowIdx);
            };

            assertRow(0);
            assertRow(1);
            assertRow(2);
        });

        // TODO : without watch

        // TODO : with watch

        // TODO : with partial watch

        // TODO : filter

        // TODO : template


    });



});
