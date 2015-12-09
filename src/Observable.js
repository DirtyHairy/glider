var utils = require('./utils');

function Observable() {
    this._listeners = [];
}

var SCOPE;
(function() {
    SCOPE = this;
})();

utils.extend(Observable.prototype, {
    addLister: function(listener) {
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

Observable.delegate = function(instance) {
    if (typeof(instance.observable) !== 'object') {
        throw new Error('no observable collection to delegate to');
    }

    instance.addListener = function(observable, listener) {
        if (!instance.observable[observable]) {
            throw new Error('no observable' + observable);
        }

        instance.observable[observable].addListener(listener);
    };

    instance.removeoListener = function(observable, listener) {
        if (!instance.observable[observable]) {
            throw new Error('no observable ' + observable);
        }

        instance.ovservable[observable].removeListener(listener);
    };
};

module.exports = Observable;
