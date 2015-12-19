var WeakMap = require('es6-weak-map'),
    utils = require('.');

function ListenerGroup() {
    this._map = new WeakMap();
}

utils.extend(ListenerGroup.prototype, {
    _map: null,

    add: function(target, event, listener) {
        var group;

        if (!this._map.has(target)) {
            group = {};

            this._map.set(target, group);
        } else {
            group = this._map.get(target);
        }

        group[event] = target.addListener(event, listener);

        return this;
    },

    remove: function(target, event) {
        if (!this._map.has(target)) {
            return this;
        }

        var group = this._map.get(target);

        if (group[event]) {
            target.removeListener(event, group[event]);
            delete group[event];

            if (Object.keys(group).length === 0) {
                this._map.delete(target);
            }
        }

        return this;
    },

    removeTarget: function(target) {
        if (!this._map.has(target)) {
            return this;
        }

        var group = this._map.get(target);

        Object.keys(group).forEach(function(event) {
            target.removeListener(event, group[event]);
        });

        this._map.delete(target);

        return this;
    }
});

module.exports = ListenerGroup;
