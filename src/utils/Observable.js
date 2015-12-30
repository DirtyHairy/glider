export default class Observable {
    constructor() {
        this._listeners = [];
    }

    addListener(listener) {
        this._listeners.push(listener);

        return listener;
    }

    removeListener(listener) {
        var i = this._listeners.indexOf(listener);

        if (i >= 0) {
            this._listener.splice(i, 1);
        }

        return this;
    }

    fire(...args) {
        const len = this._listeners.length;

        for (let i = 0; i < len; i++) {
            let cb = this._listeners[i];
            cb(...args);
        }

        return this;
    }

    static delegate(instance, collection) {
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
    }
}
