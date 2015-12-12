var WebglRenderer = require('./renderer/webgl/Renderer'),
    Transformation = require('./Transformation'),
    Controller = require('./Controller'),
    Controls = require('./Controls'),
    utils = require('./utils');

function Viewer(canvas, imageUrl) {
    this._canvas = canvas;
    this._transformation = new Transformation();
    this._renderer = new WebglRenderer(canvas, imageUrl, this._transformation);
}

utils.extend(Viewer.prototype, {
    _transformation: null,
    _renderer: null,
    _controller: null,
    _controls: null,

    init: function() {
        var me = this;

        return me._renderer.init()
            .then(function() {
                me._controller = new Controller(me._renderer);
                me._controls = new Controls(me._canvas, me._controller);
            });
    },

    getRenderer: function() {
        return this._renderer;
    },

    getCanvas: function() {
        return this._canvas;
    },

    getControls: function() {
        return this._controls;
    },

    getController: function() {
        return this._controller;
    },

    getTransformation: function() {
        return this._transformation;
    }
});

function delegate(method, target) {
    Viewer.prototype[method] = function() {
        return this[target][method].apply(this[target], arguments);
    };
}

['translateAbsolute', 'translateRelative', 'getTranslateX', 'getTranslateY', 'getScale',
        'rescale', 'rescaleAroundCenter']
    .forEach(function(method) {
        delegate(method, '_controller');
    });

module.exports = Viewer;
