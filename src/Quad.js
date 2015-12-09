var utils = require('./utils'),
    Observable = require('./Observable');

function Quad(config) {
    if (config.hasOwnProperty('x')) {
        this._x = config.x;
    }

    if (config.hasOwnProperty('y')) {
        this._y = config.y;
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

    Observable.delegate(this);
}

utils.extend(Quad.prototype, {
    _x: 0,
    _y: 0,
    _width: 0,
    _height: 0,
    _fillColor: null,

    _dirty: true,

    _notifyChange: function() {
        this._dirty = true;
        this.observable.modified.fire();
    },

    setX: function(x) {
        this._x = x;
        this._notifyChange();

        return this;
    },

    getX: function() {
        return this._x;
    },


    setY: function(y) {
        this._y = y;
        this._notifyChange();

        return this;
    },

    getY: function() {
        return this._y;
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
    },

    dirty: function() {
        return this._dirty;
    },

    clearDirty: function() {
        this._dirty = false;
    }
});

module.exports = Quad;
