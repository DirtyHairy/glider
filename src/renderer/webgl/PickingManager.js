import DependencyTracker from '../../utils/DependencyTracker';

var utils = require('../../utils'),
    PickingColorManager = require('./PickingColorManager'),
    Texture = require('./glutil/Texture'),
    FrameBufferObject = require('./glutil/FrameBufferObject');

var TEXTURE_UNIT = 1;

function PickingManager(gl, transformationMatrix, projectionMatrix, width, height, glFeatureSets) {
    this._gl = gl;
    this._dependencyTracker = new DependencyTracker();
    this._transformationMatrix = transformationMatrix;
    this._projectionMatrix = projectionMatrix;
    this._featureSets = [];
    this._glFeatureSets = glFeatureSets;
    this._colorManagers = new WeakMap();
    this._width = width;
    this._height = height;

    this._setupFramebuffer();
}

utils.extend(PickingManager.prototype, {
    _dependencyTracker: null,
    _transformationMatrix: null,
    _projectionMatrix: null,
    _featureSets: null,
    _colorManagers: null,
    _glFeatureSets: null,

    _gl: null,
    _fbo: null,
    _texture: null,

    _width: 0,
    _height: 0,
    _forceRedraw: true,

    _setupFramebuffer: function() {
        var gl = this._gl,
            fbo = new FrameBufferObject(gl),
            texture = Texture.fromPixelData(gl, this._width, this._height, null, TEXTURE_UNIT, {
            format: gl.RGBA,
            texelFormat: gl.UNSIGNED_BYTE,
            minFilter: gl.NEAREST,
            magFilter: gl.NEAREST,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE
        });

        fbo.bind(function(ctx) {
            ctx
                .attachColorTexture(texture, TEXTURE_UNIT)
                .validate();
        });

        this._texture = texture;
        this._fbo = fbo;
    },

    _assignFeatureSetIndices: function() {
        var me = this;

        me._featureSets.forEach(function(featureSet, i) {
            me._colorManagers.get(featureSet).setFeatureSetIndex(i);
        });
    },

    _render: function() {
        var me = this,
            gl = me._gl;

        if (!me._forceRedraw &&
                me._dependencyTracker.isCurrent(me._projectionMatrix) &&
                me._dependencyTracker.isCurrent(me._transformationMatrix) &&
                me._dependencyTracker.allCurrent(me._featureSets)
            )
        {
            return false;
        }

        me._fbo.bind();

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.BLEND);

        me._featureSets.forEach(function(featureSet) {
            me._glFeatureSets.get(featureSet).renderPicking(me._colorManagers.get(featureSet));
        });

        me._forceRedraw = false;

        return true;
    },

    adjustViewportSize: function(width, height) {
        this._width = width;
        this._height = height;

        this._texture.bind(TEXTURE_UNIT, function(ctx) {
            ctx.loadPixelData(width, height, null);
        });

        this._forceRedraw = true;

        return this;
    },

    addFeatureSet: function(featureSet) {
        this._featureSets.push(featureSet);
        this._colorManagers.set(featureSet, new PickingColorManager(0));
        this._assignFeatureSetIndices();

        this._forceRedraw = true;

        return this;
    },

    removeFeatureSet: function(featureSet) {
        var i = this._featureSets.indexOf(featureSet);

        if (i >= 0) {
            this._featureSets.splice(i, 1);
            this._colorManagers.delete(featureSet);
            this._assignFeatureSetIndices();

            this._forceRedraw = true;
        }

        return this;
    },

    getFeatureAt: function(x, y) {
        var gl = this._gl;

        if (x < 0 || x > this._width || y < 0 || y > this._height) {
            return null;
        }

        if (!this._render()) {
            this._fbo.bind();
        }

        var pixelData = new Uint8Array(4);

        gl.readPixels(x + this._width / 2, y + this._height / 2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);

        var featureSetIdx =     (pixelData[0] << 8) | pixelData[1],
            featureIdx =        (pixelData[2] << 8) | pixelData[3],
            featureSet = (featureSetIdx > 0 && featureSetIdx <= this._featureSets.length) ?
                this._featureSets[featureSetIdx - 1] : null,
            feature = (featureSet && featureIdx < featureSet.count()) ? featureSet.get(featureIdx) : null;

        return feature;
    },

    destroy: function() {
        var me = this;

        me._fbo = utils.destroy(me._fbo);
        me._texture = utils.destroy(me._texture);

        if (me._featureSets) {
            me._featureSets.forEach(function(featureSet) {
                me._colorManagers.delete(featureSet);
            });

            me._featureSets = null;
        }
    }
});

module.exports = PickingManager;
