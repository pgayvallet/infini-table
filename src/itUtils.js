'use strict';

itModule.factory("itUtils", function($parse) {

    var itUtils = {

        /**
         * Creates an accessor method to get or set given property on given scope.
         *
         * @param {Scope} scope : Scope to create accessor for
         * @param {String} propertyName : Name of the property to create accessor of.
         */
        createAccessor : function(scope, propertyName) {
            var getter = $parse(propertyName);
            var setter = getter.assign;
            return function(value) {
                if(arguments.length) {
                    return setter(scope, value);
                } else {
                    return getter(scope);
                }
            }
        },

        /**
         * Count the watchers attached to a scope tree.
         *
         * @param scope The scope to count watchers of.
         * @returns {number} The number of watchers actually attach to given scope and children.
         */
        countWatchers : function(scope) {
            var watchers = 0;
            itUtils.traverseScopeTree(scope, function(scope) {
                if (scope.$$watchers) {
                    watchers += scope.$$watchers.length;
                }
            });
            return watchers;
        },

        /**
         * Apply watchers of given scope even if a digest progress is already in process on another level.
         * This will only do a one-time cycle of watchers, without cascade digest.
         *
         * Please note that this is (almost) a hack, behaviour may be hazardous so please use with caution.
         *
         * @param {Scope} scope : scope to apply watchers from.
         */
        applyWatchers : function(scope) {
            itUtils.traverseScopeTree(scope, function(scope) {
                var watchers = scope.$$watchers;
                if(!watchers) {
                    return;
                }
                var watcher;
                for(var i=0; i<watchers.length; i++) {
                    watcher = watchers[i];
                    var value = watcher.get(scope);
                    watcher.fn(value, value, scope);
                }
            });
        },

        /**
         * Traverse given scope and all of the scope children tree, calling given function for each scope.
         * @param parentScope
         * @param traverseFn The function executed for each scope, having the scope as only parameter.
         */
        traverseScopeTree : function(parentScope, traverseFn) {
            var next,
                current = parentScope,
                target = parentScope;
            do {
                traverseFn(current);

                if (!(next = (current.$$childHead ||
                    (current !== target && current.$$nextSibling)))) {
                    while(current !== target && !(next = current.$$nextSibling)) {
                        current = current.$parent;
                    }
                }
            } while((current = next));
        },

        /**
         * Aliases for common keyboard key codes
         */
        keyCodes : {
            BACKSPACE: 8,
            COMMA: 188,
            DELETE: 46,
            DOWN: 40,
            END: 35,
            ENTER: 13,
            ESCAPE: 27,
            HOME: 36,
            LEFT: 37,
            NUMPAD_ADD: 107,
            NUMPAD_DECIMAL: 110,
            NUMPAD_DIVIDE: 111,
            NUMPAD_ENTER: 108,
            NUMPAD_MULTIPLY: 106,
            NUMPAD_SUBTRACT: 109,
            PAGE_DOWN: 34,
            PAGE_UP: 33,
            PERIOD: 190,
            RIGHT: 39,
            SPACE: 32,
            TAB: 9,
            UP: 38
        }

    };

    return itUtils;

});
