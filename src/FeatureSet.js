var utils = require('./utils'),
    Observable = require('./utils/Observable'),
    DependencyProvider = require('./utils/DependencyProvider'),
    WeakMap = require('es6-weak-map');

function FeatureSet() {
    this._features = [];

    this.observable = {
        add: new Observable(),
        remove: new Observable(),
        change: new Observable()
    };

    Observable.delegate(this);

    this._featureContext = new WeakMap();

    this._dependencyProvider = new DependencyProvider(this);
}

utils.extend(FeatureSet.prototype, {
    _features: null,
    _dependencyProvider: null,
    _featureContext: null,

    add: function(feature) {
        this._features.push(feature);
        this._featureContext.set(feature, new FeatureContext(this, feature));

        this._dependencyProvider.bump();
        this.observable.add.fire(feature);

        return this;
    },

    remove: function(feature) {
        var i = this._features.indexOf(feature);

        if (i >= 0) {
            this._features.splice(i, 1);
            this._featureContext.get(feature).destroy();
            this._featureContext.delete(feature);

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

    _onFeatureChange: function(feature) {
        this._dependencyProvider.bump();
        this.observable.change.fire(feature);
    }
});

module.exports = FeatureSet;

function FeatureContext(featureSet, feature) {
    this._listeners = {
        change: feature.addListener('change', featureSet._onFeatureChange.bind(featureSet, feature))
    };
}

utils.extend(FeatureContext.prototype, {
    _feature: null,
    _listeners: null,

    destroy: function() {
        var me = this;

        Object.keys(me._listeners).forEach(function(event) {
            me._feature.removeListener(event, me._listeners[event]);
        });

        me._feature = me._listeners = null;
    }
});
