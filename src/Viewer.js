var WebglRenderer = require('./renderer/webgl/Renderer'),
    Transformation = require('./Transformation'),
    Controller = require('./Controller'),
    Controls = require('./Controls'),
    RenderControl = require('./RenderControl'),
    utils = require('./utils');

function Viewer(canvas, imageUrl) {
    this._canvas = canvas;
    this._transformation = new Transformation();
    this._renderer = new WebglRenderer(canvas, imageUrl, this._transformation);
    this._renderControl = new RenderControl(this._renderer);
    this._featureSets = [];
}

utils.extend(Viewer.prototype, {
    _transformation: null,
    _renderer: null,
    _renderControl: null,
    _controller: null,
    _controls: null,
    _featureSets: null,

    init: function() {
        var me = this;

        return me._renderer.init()
            .then(function() {
                me._controller = new Controller(me._renderControl, me._transformation);
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
    },

    addFeatureSet: function(featureSet) {
        this._featureSets.push();
        this._renderer.addFeatureSet(featureSet);
        this._renderControl.render();

        return this;
    }
});

utils.delegate(Viewer.prototype, '_controller', [
    'getTranslateX', 'getTranslateY', 'getScale'
]);

utils.delegateFluent(Viewer.prototype, '_controller', [
    'translateAbsolute', 'translateRelative', 'rescale', 'rescaleAroundCenter'
]);

utils.delegateFluent(Viewer.prototype, '_renderControl', [
    'render', 'suspendRender', 'resumeRender', 'startBatch', 'commitBatch'
]);

module.exports = Viewer;
