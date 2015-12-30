var utils = require('.'),
    WeakMap = require('es6-weak-map');

function DependencyTracker() {
    this._map = new WeakMap();
}

utils.extend(DependencyTracker.prototype, {
    _map: null,

    isCurrent: function(target) {
        return this._map.has(target) && (this._map.get(target) === target._dependencyGeneration);
    },

    setCurrent: function(target) {
        this._map.set(target, target._dependencyGeneration);

        return this;
    },

    update: function(target, cb) {
        if (this.isCurrent(target)) {
            return this;
        }

        cb();

        this.setCurrent(target);

        return this;
    },

    allCurrent: function(targets) {
        var isCurrent = true,
            nTargets = targets.length,
            i;

        for (i = 0; i < nTargets; i++) {
            if (!isCurrent) {
                return false;
            }

            isCurrent = isCurrent && this.isCurrent(targets[i]);
        }

        return isCurrent;
    },

    updateAll: function(targets, cb) {
        if (this.allCurrent(targets)) {
            return this;
        }

        var nTargets = targets.length,
            i;

        cb();

        for (i = 0; i < nTargets; i++) {
            this.setCurrent(targets[i]);
        }

        return this;
    }
});

module.exports  = DependencyTracker;
