var utils = require('./utils'),
    Observable = require('./utils/Observable'),
    DependencyProvider = require('./utils/DependencyProvider');

function Quad(config) {
    if (config.hasOwnProperty('left')) {
        this._left = config.left;
    }

    if (config.hasOwnProperty('bottom')) {
        this._bottom = config.bottom;
    }

    if (config.hasOwnProperty('width')) {
        this._width = config.width;
    }

    if (config.hasOwnProperty('height')) {
        this._height = config.height;
    }

    if (config.hasOwnProperty('fillColor')) {
        this._height = config.fillColor;
    }

    this.observable = {
        modified: new Observable()
    };

    Observable.delegate(this, this.observable);

    this._dependencyProvider = new DependencyProvider(this);
}

utils.extend(Quad.prototype, {
    _left: 0,
    _bottom: 0,
    _width: 0,
    _height: 0,
    _fillColor: null,

    _dependencyProvider: null,

    _notifyChange: function() {
        this._dependencyProvider.bump();
        this.observable.modified.fire();
    },

    setLeft: function(left) {
        this._left = left;
        this._notifyChange();

        return this;
    },

    getXLeft: function() {
        return this._left;
    },


    setBottom: function(bottom) {
        this._bottom = bottom;
        this._notifyChange();

        return this;
    },

    getBottom: function() {
        return this._bottom;
    },


    setWidth: function(width) {
        this._width = width;
        this._notifyChange();

        return this;
    },

    getWidth: function() {
        return this._width;
    },


    setHeight: function(height) {
        this._height = height;
        this._notifyChange();

        return this;
    },

    getHeight: function() {
        return this._height;
    },


    setColor: function(color) {
        this._color = color;
        this._notifyChange();

        return this;
    },

    getColor: function() {
        return this._color;
    }
});

module.exports = Quad;
