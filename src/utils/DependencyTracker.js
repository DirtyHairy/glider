/* jshint esnext: true */

function DependencyTracker() {
    var map = new WeakMap();

    this.isCurrent = function(target) {
        return map.has(target) && (map.get(target) === target._dependencyGeneration);
    };

    this.setCurrent = function(target) {
        map.set(target, target._dependencyGeneration);
    };
}

module.exports  = DependencyTracker;
