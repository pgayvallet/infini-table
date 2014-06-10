beforeEach(function() {
    this.addMatchers({
        toContainAll: function() {
            var actual = this.actual;
            return _(jasmine.util.argsToArray(arguments)).all(function(expected) {
                return _(actual).include(expected);
            });
        }
    });
});