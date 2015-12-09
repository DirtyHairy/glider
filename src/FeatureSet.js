var utils = require('./utils'),
    Observable = require('./Observable');

function FeatureSet() {
    this._features = [];

    this.observable = {
        add: new Observable(),
        remove: new Observable(),
        change: new Observable()
    };

    Observable.delegate(this);
}

utils.extend(FeatureSet.prototype, {
    _features: null,
    _dirty: true,

    _notifyChange: function() {
        this._dirty = true;
        this.observable.change.fire();
    },

    add: function(feature) {
        this._features.push(feature);
        this._notifyChange();
        this.observable.add.fire(feature);

        return this;
    },

    remove: function(feature) {
        var i = this._features.indexOf(feature);

        if (i >= 0) {
            this._features.splice(i, 1);
        }

        this._notifyChange();
        this.observable.remove.fire(feature);

        return this;
    }
});

module.exports = FeatureSet;
