var utils = require('.');

function Observable() {
    this._listeners = [];
}

var SCOPE;
(function() {
    SCOPE = this;
})();

utils.extend(Observable.prototype, {
    addListener: function(listener) {
        this._listeners.push(listener);

        return listener;
    },

    removeListener: function(listener) {
        var i = this._listeners.indexOf(listener);

        if (i >= 0) {
            this._listener.splice(i, 1);
        }

        return this;
    },

    fire: function() {
        var i,
            len = this._listeners.length;

        for (i = 0; i < len; i++) {
            this._listeners[i].apply(SCOPE, arguments);
        }

        return this;
    }
});

Observable.delegate = function(instance, collection) {
    instance.addListener = function(observable, listener) {
        if (!collection[observable]) {
            throw new Error('no observable' + observable);
        }

        collection[observable].addListener(listener);
    };

    instance.removeListener = function(observable, listener) {
        if (!collection[observable]) {
            throw new Error('no observable ' + observable);
        }

        collection[observable].removeListener(listener);
    };
};

module.exports = Observable;
