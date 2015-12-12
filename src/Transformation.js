var utils = require('./utils'),
    DependencyProvider = require('./utils/DependencyProvider');

function Transformation() {
    this._dependencyProvider = new DependencyProvider(this);
}

utils.extend(Transformation.prototype, {
    _scale: 1,
    _translateX: 0,
    _translateY: 0,
    _dependencyProvider: null,

    setScale: function(scale) {
        this._scale = scale;
        this._dependencyProvider.bump();

        return this;
    },

    setTranslateX: function(dx) {
        this._translateX = dx;
        this._dependencyProvider.bump();

        return this;
    },

    setTranslateY: function(dy) {
        this._translateY = dy;
        this._dependencyProvider.bump();

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
