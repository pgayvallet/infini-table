'use strict';

describe('Util : itUtils', function () {

    beforeEach(module('infiniTable'));

    var util, rootScope;

    beforeEach(inject(function (itUtils, $rootScope) {
        util = itUtils;
        rootScope = $rootScope;
    }));

    describe("#traverseScopeTree", function() {

        it("should call the traverse function for given scope and every child", function() {

            var goodScope = rootScope.$new(),
                child1 = goodScope.$new(),
                child2 = goodScope.$new(),
                grandChild1 = child1.$new(),
                badScope = rootScope.$new();

            var traversed = [];

            util.traverseScopeTree(goodScope, function(scope) {
                traversed.push(scope.$id);
            });

            expect(traversed).toContainAll(goodScope.$id, child1.$id, child2.$id, grandChild1.$id);
            expect(traversed).not.toContain(badScope.$id);
        });

        it("should traverse scopes even if they are isolated", function() {

            var parentScope = rootScope.$new(),
                isolatedScope = parentScope.$new(true);

            var traversed = [];

            util.traverseScopeTree(parentScope, function(scope) {
                traversed.push(scope.$id);
            });

            expect(traversed).toContainAll(parentScope.$id, isolatedScope.$id);
        });

    });

    describe("#countWatchers", function() {

        it("should count the watchers of given scope", function() {

            var scope = rootScope.$new();

            expect(util.countWatchers(scope)).toBe(0);

            scope.$watch("valueA", angular.noop);
            scope.$watch("valueB", angular.noop);

            expect(util.countWatchers(scope)).toBe(2);
        });

        it("should count watchers of every children", function() {

            var parentScope = rootScope.$new();
            var childScope = parentScope.$new();

            expect(util.countWatchers(parentScope)).toBe(0);

            parentScope.$watch("valueA", angular.noop);
            parentScope.$watch("valueB", angular.noop);

            childScope.$watch("valueB", angular.noop);

            expect(util.countWatchers(parentScope)).toBe(3);
        });

    });

    describe("#createAccessor", function() {

        it("should create an accessor method for given scope and property", function() {

            var scope = rootScope.$new();
            var accessor = util.createAccessor(scope, "myProp");

            expect(accessor()).toBeUndefined();

            scope.myProp = "foo";
            expect(accessor()).toBe("foo");

            accessor("bar");
            expect(scope.myProp).toBe("bar");
        });

    });

});