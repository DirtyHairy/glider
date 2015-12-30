import DependencyProvider from './utils/DependencyProvider';
import Observable from './utils/Observable';

var utils = require('./utils');

function Transformation() {
    this._dependencyProvider = new DependencyProvider(this);
    this.observable = {
        change: new Observable()
    };

    Observable.delegate(this, this.observable);
}

utils.extend(Transformation.prototype, {
    _scale: 1,
    _translateX: 0,
    _translateY: 0,
    _dependencyProvider: null,

    _notifyChange: function() {
        this._dependencyProvider.bump();
        this.observable.change.fire();
    },

    setScale: function(scale) {
        this._scale = scale;
        this._notifyChange();

        return this;
    },

    setTranslateX: function(dx) {
        this._translateX = dx;
        this._notifyChange();

        return this;
    },

    setTranslateY: function(dy) {
        this._translateY = dy;
        this._notifyChange();

        return this;
    },

    getScale: function() {
        return this._scale;
    },

    getTranslateX: function() {
        return this._translateX;
    },

    getTranslateY: function() {
        return this._translateY;
    }
});


module.exports = Transformation;
