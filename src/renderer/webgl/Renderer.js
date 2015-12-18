var utils = require('../../utils'),
    ImageLayer = require('./ImageLayer'),
    ProjectionMatrix = require('./ProjectionMatrix'),
    TransformationMatrix = require('./TransformationMatrix'),
    DependencyTracker = require('../../utils/DependencyTracker'),
    GlFeatureSet = require('./GlFeatureSet'),
    WeakMap = require('es6-weak-map');

function Renderer(canvas, imageUrl, transformation) {
    this._canvas = canvas;
    this._gl = canvas.getContext('webgl');
    this._transformation = transformation;
    this._animations = [];
    this._dependencyTracker = new DependencyTracker();

    this._projectionMatrix = new ProjectionMatrix(canvas.width, canvas.heigth);
    this._transformationMatrix = new TransformationMatrix(transformation);

    this._featureSets = [];
    this._glFeatureSets = new WeakMap();

    this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);

    this._imageLayer = new ImageLayer(imageUrl, this._gl, this._projectionMatrix, this._transformationMatrix);
}

utils.extend(Renderer.prototype, {
    _canvas: null,
    _gl: null,
    _dependencyTracker: null,
    _imageLayer: null,

    _transformation: null,
    _projectionMatrix: null,
    _transformationMatrix: null,

    _renderPending: false,
    _animations: null,

    _featureSets: null,
    _glFeatureSets: null,

    _immediateRender: function() {
        var gl = this._gl,
            i;

        if (this._isFramebufferCurrent()) {
            return;
        }

        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.disable(gl.BLEND);
        this._imageLayer.render();

        gl.enable(gl.BLEND);
        for (i = 0; i < this._featureSets.length; i++) {
            this._glFeatureSets.get(this._featureSets[i]).render();
        }
    },

    _isFramebufferCurrent: function() {
        var isCurrent,
            i;

        isCurrent = this._dependencyTracker.isCurrent(this._projectionMatrix) &&
            this._dependencyTracker.isCurrent(this._transformationMatrix);

        for (i = 0; i < this._featureSets.length; i++) {
            if (!isCurrent) {
                break;
            }

            isCurrent = isCurrent && this._dependencyTracker.isCurrent(this._featureSets[i]);
        }

        return isCurrent;
    },

    _scheduleAnimations: function() {
        var me = this;

        requestAnimationFrame(function(timestamp) {
            var i = 0,
                len = me._animations.length,
                render = false;

            while (i < len) {
                me._animations[i].progress(timestamp);

                if (me._animations[i].finished()) {
                    len--;
                    me.removeAnimation(me._animations[i]);
                } else {
                    render = render || me._animations[i].render();
                    i++;
                }
            }

            if (render) {
                me._immediateRender();
            }

            if (len > 0) {
                me._scheduleAnimations();
            }
        });
    },

    render: function() {
        var me = this;

        if (!me._imageLayer.isReady() || me._renderPending || (me._animations && me._animations.length > 0)) {
            return;
        }

        requestAnimationFrame(function() {
            me._renderPending = false;
            me._immediateRender();
        });

        me._renderPending = true;

        return this;
    },

    getCanvas: function() {
        return this._canvas;
    },

    applyCanvasResize: function() {
        this._gl.viewport(0, 0, this._canvas.width, this._canvas.height);
        this._projectionMatrix
            .setWidth(this._canvas.width)
            .setHeight(this._canvas.height);

        return this;
    },

    getImageWidth: function() {
        return this._imageLayer.getImageWidth();
    },

    getImageHeight: function() {
        return this._imageLayer.getImageHeight();
    },

    addAnimation: function(animation) {
        this._animations.push(animation);

        this._scheduleAnimations();

        return this;
    },

    removeAnimation: function(animation) {
        var i = this._animations.indexOf(animation);

        if (i >= 0) {
            this._animations.splice(i, 1);
        }
    },

    addFeatureSet: function(featureSet) {
        this._featureSets.push(featureSet);
        this._glFeatureSets.set(featureSet,
            new GlFeatureSet(this._gl, featureSet, this._projectionMatrix, this._transformationMatrix));
    },

    removeFeatureSet: function(featureSet) {
        var i = this._featureSets.indexOf(featureSet);

        if (i >= 0) {
            this._featureSets.splice(i, 1);
            this._glFeatureSets.delete(featureSet);
        }
    },

    ready: function() {
        return this._imageLayer.ready();
    }
});

module.exports = Renderer;
