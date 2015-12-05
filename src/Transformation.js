var utils = require('./utils');

function Transformation() {}

utils.extend(Transformation.prototype, {
    _scale: 1,
    _translateX: 0,
    _translateY: 0,

    _dirty: true,

    setScale: function(scale) {
        this._scale = scale;
        this._dirty = true;

        return this;
    },

    setTranslateX: function(dx) {
        this._translateX = dx;
        this._dirty = true;

        return this;
    },

    setTranslateY: function(dy) {
        this._translateY = dy;
        this._dirty = true;

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
    },

    dirty: function() {
        return this._dirty;
    },

    clearDirty: function() {
        this._dirty = false;
    }
});


module.exports = Transformation;
