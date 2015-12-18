var pshim = require('es6-promise'),
    utils = require('../../utils'),
    Program = require('./glutil/Program'),
    Texture = require('./glutil/Texture'),
    ProjectionMatrix = require('./ProjectionMatrix'),
    TransformationMatrix = require('./TransformationMatrix'),
    DependencyTracker = require('../../utils/DependencyTracker'),
    GlFeatureSet = require('./GlFeatureSet'),
    WeakMap = require('es6-weak-map');

var fs = require('fs');

var imageLayerVertexShaderSource =
        fs.readFileSync(__dirname + '/shader/imagelayer.vsh').toString(),
    imageLayerFragmentShaderSource =
        fs.readFileSync(__dirname + '/shader/imagelayer.fsh').toString();

var TEXTURE_UNIT = 0;

function Renderer(canvas, imageUrl, transformation) {
    this._canvas = canvas;
    this._gl = canvas.getContext('webgl');
    this._imageUrl = imageUrl;
    this._transformation = transformation;
    this._animations = [];
    this._dependencyTracker = new DependencyTracker();

    this._projectionMatrix = new ProjectionMatrix(canvas.width, canvas.heigth);
    this._transformationMatrix = new TransformationMatrix(transformation);

    this._featureSets = [];
    this._glFeatureSets = new WeakMap();

    this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);
}

utils.extend(Renderer.prototype, {
    _canvas: null,
    _imageUrl: null,
    _imageData: null,
    _gl: null,
    _dependencyTracker: null,
    _ready: false,

    _imageWidth: null,
    _imageHeight: null,

    _program: null,
    _vertexBuffer: null,
    _textureCoordinateBuffer: null,
    _texture: null,

    _transformation: null,
    _projectionMatrix: null,
    _transformationMatrix: null,

    _renderPending: false,
    _animations: null,

    _featureSets: null,
    _glFeatureSets: null,

    _loadImageData: function() {
        var me = this;

        return loadImage(this._imageUrl)
            .then(function(image) {
                    var paddedWidth = Math.pow(2, Math.floor(Math.log(image.width) / Math.log(2)) + 1),
                        paddedHeight = Math.pow(2, Math.floor(Math.log(image.width) / Math.log(2)) + 1),
                        canvas = document.createElement('canvas'),
                        ctx = canvas.getContext('2d');

                    canvas.width = paddedWidth;
                    canvas.height = paddedHeight;

                    me._imageWidth = image.width;
                    me._imageHeight = image.height;

                    ctx.drawImage(image,
                        0, 0, image.width, image.height,
                        0, paddedHeight - image.height, image.width, image.height);

                    return canvas;
                });
    },

    _createVertexBuffer: function() {
        var me = this,
            gl = me._gl,
            vertexBuffer = gl.createBuffer(),
            width = me._imageWidth,
            height = me._imageHeight,
            data = [
                -width/2, height/2,    width/2, height/2,
                -width/2, -height/2,   width/2, -height/2
            ];

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

        return vertexBuffer;
    },

    _createTextureCoordinateBuffer: function() {
        var me = this,
            gl = me._gl,
            textureCoordinateBuffer = gl.createBuffer(),
            width = me._imageWidth,
            height = me._imageHeight,
            textureWidth = me._imageData.width,
            textureHeight = me._imageData.height,
            scaleH = width / textureWidth,
            scaleV = height / textureHeight,
            data = [
                0, scaleV,      scaleH, scaleV,
                0, 0 ,          scaleH, 0
            ];

        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordinateBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

        return textureCoordinateBuffer;
    },

    _rebindBuffers: function() {
        var me = this,
            gl = me._gl;

        me._program.use(function() {
            gl.bindBuffer(gl.ARRAY_BUFFER, me._vertexBuffer);
            this.enableVertexAttribArray('a_VertexPosition');
            this.vertexAttribPointer('a_VertexPosition', 2, gl.FLOAT);

            gl.bindBuffer(gl.ARRAY_BUFFER, me._textureCoordinateBuffer);
            this.enableVertexAttribArray('a_TextureCoordinate');
            this.vertexAttribPointer('a_TextureCoordinate', 2, gl.FLOAT);
        });
    },

    _updateProjectionMatrix: function() {
        var me = this;

        me._dependencyTracker.update(me._projectionMatrix, function() {
            me._program.use(function() {
                this.uniformMatrix4fv('u_ProjectionMatrix', me._projectionMatrix.getMatrix());
            });
        });
    },

    _updateTransformationMatrix: function() {
        var me = this;

        me._dependencyTracker.update(me._transformationMatrix, function() {
            me._program.use(function() {
                this.uniformMatrix4fv('u_TransformationMatrix', me._transformationMatrix.getMatrix());
            });
        });
    },

    _createTexture: function() {
        return new Texture(this._gl, this._imageData, TEXTURE_UNIT, {
            magFilter: this._gl.LINEAR,
            minFilter: this._gl.LINEAR_MIPMAP_NEAREST,
            flipY: true
        });
    },

    _immediateRender: function() {
        var me = this,
            gl = this._gl,
            isCurrent,
            i;

        isCurrent = me._dependencyTracker.isCurrent(me._projectionMatrix) &&
            me._dependencyTracker.isCurrent(me._transformationMatrix);

        for (i = 0; i < me._featureSets.length; i++) {
            if (!isCurrent) {
                break;
            }

            isCurrent = isCurrent && me._dependencyTracker.isCurrent(me._featureSets[i]);
        }

        if (isCurrent) {
            return;
        }

        me._updateProjectionMatrix();
        me._updateTransformationMatrix();

        me._program.use(function() {
            this.uniform1i('u_Sampler', TEXTURE_UNIT);
        });

        gl.disable(gl.BLEND);
        gl.clear(gl.COLOR_BUFFER_BIT);

        me._rebindBuffers();
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.enable(gl.BLEND);
        for (i = 0; i < me._featureSets.length; i++) {
            me._glFeatureSets.get(me._featureSets[i]).render();
        }
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

    init: function() {
        var me = this;

        me._gl.clearColor(1, 1, 1, 1);
        me._gl.depthMask(false);

        me._program = new Program(me._gl, imageLayerVertexShaderSource, imageLayerFragmentShaderSource);

        return me._loadImageData()
            .then(function(imageData) {
                me._imageData = imageData;
                me._texture = me._createTexture();

                me._vertexBuffer = me._createVertexBuffer();
                me._textureCoordinateBuffer = me._createTextureCoordinateBuffer();
                me._updateProjectionMatrix();

                me._ready = true;
            });
    },

    getTransformation: function() {
        return this._transformation;
    },

    render: function() {
        var me = this;

        if (!me._ready || me._renderPending || (me._animations && me._animations.length > 0)) {
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

        this.render();

        return this;
    },

    getImageWidth: function() {
        return this._imageWidth;
    },

    getImageHeight: function() {
        return this._imageHeight;
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
    }
});

module.exports = Renderer;

function loadImage(url) {
    var image = new Image();

    return new pshim.Promise(function(resolve, reject) {
        image.addEventListener('load', function() {
            resolve(image);
        });

        image.addEventListener('error', function() {
            reject(new Error('image load for ' + url + ' failed'));
        });

        image.src = url;
    });
}
