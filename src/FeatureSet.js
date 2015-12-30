import DependencyProvider from './utils/DependencyProvider';
import Observable from './utils/Observable';
import ListenerGroup from './utils/ListenerGroup';

var utils = require('./utils');

function FeatureSet() {
    this._features = [];

    this.observable = {
        add: new Observable(),
        remove: new Observable(),
        change: new Observable()
    };

    Observable.delegate(this, this.observable);

    this._listeners = new ListenerGroup();
    this._dependencyProvider = new DependencyProvider(this);
}

utils.extend(FeatureSet.prototype, {
    _features: null,
    _dependencyProvider: null,
    _listeners: null,

    _onFeatureChange: function(feature) {
        this._dependencyProvider.bump();
        this.observable.change.fire(feature);
    },


    add: function(feature) {
        this._features.push(feature);
        this._listeners.add(feature, 'change', this._onFeatureChange.bind(this, feature));

        this._dependencyProvider.bump();
        this.observable.add.fire(feature);

        return this;
    },

    remove: function(feature) {
        var i = this._features.indexOf(feature);

        if (i >= 0) {
            this._features.splice(i, 1);
            this._listeners.removeTarget(feature);

            this._dependencyProvider.bump();
            this.observable.remove.fire(feature);
        }

        return this;
    },

    count: function() {
        return this._features.length;
    },

    forEach: function(cb, scope) {
        this._features.forEach(cb, scope);

        return this;
    },

    get: function(i) {
        return this._features[i];
    },

    destroy: function() {
        var me = this;

        if (me._features) {
            me._features.forEach(function(feature) {
                me._listeners.removeTarget(feature);
                utils.destroy(feature);
            });

            me._features = null;
        }
    }
});

module.exports = FeatureSet;
