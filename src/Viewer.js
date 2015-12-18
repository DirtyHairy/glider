var WebglRenderer = require('./renderer/webgl/Renderer'),
    Transformation = require('./Transformation'),
    Controller = require('./Controller'),
    Controls = require('./Controls'),
    RenderControl = require('./RenderControl'),
    WeakMap = require('es6-weak-map'),
    utils = require('./utils');

function Viewer(canvas, imageUrl) {
    this._canvas = canvas;
    this._transformation = new Transformation();
    this._renderer = new WebglRenderer(canvas, imageUrl, this._transformation);
    this._renderControl = new RenderControl(this._renderer);
    this._featureSets = [];
    this._featureSetContext = new WeakMap();

    this._readyPromise = this._init();
}

utils.extend(Viewer.prototype, {
    _transformation: null,
    _renderer: null,
    _renderControl: null,
    _controller: null,
    _controls: null,
    _featureSets: null,
    _readyPromise: null,
    _featureSetContext: null,

    _init: function() {
        var me = this;

        return me._renderer.ready()
            .then(function() {
                me._controller = new Controller(me._renderControl, me._transformation);
                me._controls = new Controls(me._canvas, me._controller);

                me._renderControl.render();
            });
    },

    _onFeatureSetChange: function() {
        this._renderControl.render();
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
        this._featureSetContext[featureSet] = new FeatureSetContext(this, featureSet);

        this._renderControl.render();

        return this;
    },

    removeFeatureSet: function(featureSet) {
        var i = this._featureSets.indexOf(featureSet);

        if (i >= 0) {
            this._featureSetContext.get(featureSet).destroy();
            this._featureSetContext.delete(featureSet);
            this._featureSets.splice(i, 1);

            this._renderControl.render();
        }
    },

    ready: function() {
        return this._readyPromise;
    },

    applyCanvasResize: function() {
        this._renderer.applyCanvasResize();
        this._controller.clampToScreen();
        this._renderControl.render();
    },

    destroy: function() {
        var me = this;

        me._renderer = utils.destroy(me._renderer);
        me._controller = utils.destroy(me._controller);
        me._controls = utils.destroy(me._controls);
        me._transformation = utils.destroy(me._transformation);

        if (me._featureSets) {
            me._featureSets.forEach(function(featureSet) {
                this._featureSetContext.get(featureSet).destroy();
                this._featureSetContext.delete(featureSet);
                utils.destroy(featureSet.destroy);
            });

            me._featureSets = null;
        }
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

function FeatureSetContext(viewer, featureSet) {
    this._featureSet = featureSet;

    this._featureSetListeners = {
        add: featureSet.addListener('add', viewer._onFeatureSetChange.bind(viewer, featureSet)),
        remove: featureSet.addListener('remove', viewer._onFeatureSetChange.bind(viewer, featureSet)),
        change: featureSet.addListener('change', viewer._onFeatureSetChange.bind(viewer, featureSet))
    };
}

utils.extend(FeatureSetContext.prototype, {
    _featureSet: null,
    _featreSetListeners: null,

    destroy: function() {
        var me = this;

        Object.keys(me._featureSetListeners).forEach(function(event) {
            me.featureSet.removeListener(event, me._featureSetListeners[event]);
        });
    }
});
