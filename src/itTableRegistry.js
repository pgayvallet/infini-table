'use strict';

itModule.factory("itTableRegistry", function() {

    var registryMap = {};

    var registry = {

        /**
         * Register the table to the registry.
         *
         * @returns {Function} unregistering function
         */
        register : function(tableId, tableCtrl) {
            if(_.contains(registryMap, tableId)) {
                throw "Table already registered for id " + tableId + ". is there a naming conflict ?";
            }
            registryMap[tableId] = tableCtrl;
            return function() {
                registry.unregister(tableId);
            }
        },

        /**
         * Get API controller for given table
         *
         * @param tableId
         */
        getController : function(tableId) {
            return registryMap[tableId];
        },

        /**
         * Unregister given table.
         */
        unregister : function(tableId) {
            delete registryMap[tableId];
        }

    };

    return registry;
});

