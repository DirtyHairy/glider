import DependencyTracker from '../../utils/DependencyTracker';
import GlFeatureSet from './GlFeatureSet';
import * as utils from '../../utils';

var ImageLayer = require('./ImageLayer'),
    ProjectionMatrix = require('./ProjectionMatrix'),
    TransformationMatrix = require('./TransformationMatrix'),
    PickingManager = require('./PickingManager');

function Renderer(canvas, imageUrl, transformation) {
    this._canvas = canvas;

    var gl = this._gl = canvas.getContext('webgl');
    gl.disable(gl.DEPTH_TEST);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this._transformation = transformation;
    this._animations = [];
    this._dependencyTracker = new DependencyTracker();

    this._projectionMatrix = new ProjectionMatrix(canvas.width, canvas.heigth);
    this._transformationMatrix = new TransformationMatrix(transformation);

    this._featureSets = [];
    this._glFeatureSets = new WeakMap();
    this._pickingManager = new PickingManager(this._gl, this._transformationMatrix,
        this._projectionMatrix, canvas.width, canvas.height, this._glFeatureSets);

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
    _pickingManager: null,

    _destroyed: false,

    _immediateRender: function() {
        var gl = this._gl,
            i;

        if (this._destroyed || this._isFramebufferCurrent()) {
            return;
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(1, 1, 1, 1);
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

            if (len > 0 && ! me._destroyed) {
                me._scheduleAnimations();
            }
        });
    },

    render: function() {
        var me = this;

        if (!me._imageLayer.isReady() || me._renderPending || (me._animations && me._animations.length > 0)) {
            return this;
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

        this._pickingManager.adjustViewportSize(this._canvas.width, this._canvas.height);

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

        return this;
    },

    addFeatureSet: function(featureSet) {
        this._featureSets.push(featureSet);
        this._glFeatureSets.set(featureSet,
            new GlFeatureSet(this._gl, featureSet, this._projectionMatrix, this._transformationMatrix));

        this._pickingManager.addFeatureSet(featureSet);

        return this;
    },

    removeFeatureSet: function(featureSet) {
        var i = this._featureSets.indexOf(featureSet);

        if (i >= 0) {
            this._featureSets.splice(i, 1);
            this._glFeatureSets.get(featureSet).destroy();
            this._glFeatureSets.delete(featureSet);
            this._pickingManager.removeFeatureSet(featureSet);
        }

        return this;
    },

    ready: function() {
        return this._imageLayer.ready();
    },

    destroy: function() {
        this._imageLayer = utils.destroy(this._imageLayer);
        this._transformationMatrix = utils.destroy(this._transformationMatrix);
        this._projectionMatrix = utils.destroy(this._projectionMatrix);
        this._pickingManager = utils.destroy(this._pickingManager);

        if (this._featureSets) {
            this._featureSets.forEach(function(featureSet) {
                utils.destroy(this._glFeatureSets.get(featureSet));
                this._glFeatureSets.delete(featureSet);
            }, this);

            this._featureSets = null;
        }

        this._destroyed = true;
    }
});


utils.delegate(Renderer.prototype, '_pickingManager', 'getFeatureAt');

module.exports = Renderer;
