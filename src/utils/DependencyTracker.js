var WeakMap = require('es6-weak-map');

function DependencyTracker() {
    var map = new WeakMap();

    this.isCurrent = function(target) {
        return map.has(target) && (map.get(target) === target._dependencyGeneration);
    };

    this.setCurrent = function(target) {
        map.set(target, target._dependencyGeneration);
    };

    this.update = function(target, cb) {
        if (this.isCurrent(target)) {
            return this;
        }

        cb();

        this.setCurrent(target);

        return this;
    };
}

module.exports  = DependencyTracker;
