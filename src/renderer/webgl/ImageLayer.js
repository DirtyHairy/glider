var Promise = require('es6-promise').Promise,
    utils = require('../../utils'),
    Program = require('./glutil/Program'),
    Texture = require('./glutil/Texture'),
    DependencyTracker = require('../../utils/DependencyTracker');

var fs = require('fs');

var imageLayerVertexShaderSource =
        fs.readFileSync(__dirname + '/shader/imagelayer.vsh').toString(),
    imageLayerFragmentShaderSource =
        fs.readFileSync(__dirname + '/shader/imagelayer.fsh').toString();

var TEXTURE_UNIT = 0;

function ImageLayer(url, gl, projectionMatrix, transformationMatrix) {
    this._url = url;
    this._gl = gl;
    this._projectionMatrix = projectionMatrix;
    this._transformationMatrix = transformationMatrix;
    this._dependencyTracker = new DependencyTracker();

    this._program = new Program(gl, imageLayerVertexShaderSource, imageLayerFragmentShaderSource);
    this._readyPromise = this._init();
}

utils.extend(ImageLayer.prototype, {
    _url: '',
    _gl: null,
    _projectionMatrix: null,
    _transformationMatrix: null,
    _dependencyTracker: null,
    _program: null,

    _imageHeight: 0,
    _imageWidth: 0,
    _textureWidth: 0,
    _textureHeight: 0,

    _vertexBuffer: null,
    _textureCoordinateBuffer: null,
    _texture: null,

    _readyPromise: null,
    _isReady: false,

    _init: function() {
        var me = this;

        return me._loadImageData()
            .then(function(imageData) {
                me._createTexture(imageData);
                me._createVertexBuffer();
                me._createTextureCoordinateBuffer();

                me._isReady = true;
            });
    },

    _loadImageData: function() {
        var me = this;

        return loadImage(me._url)
            .then(function(image) {
                    var paddedWidth = Math.pow(2, Math.floor(Math.log(image.width) / Math.log(2)) + 1),
                        paddedHeight = Math.pow(2, Math.floor(Math.log(image.width) / Math.log(2)) + 1),
                        canvas = document.createElement('canvas'),
                        ctx = canvas.getContext('2d');

                    canvas.width = me._textureWidth = paddedWidth;
                    canvas.height = me._textureHeight = paddedHeight;

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
            width = me._imageWidth,
            height = me._imageHeight,
            data = [
                -width/2, height/2,    width/2, height/2,
                -width/2, -height/2,   width/2, -height/2
            ];

        me._vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, me._vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    },

    _createTextureCoordinateBuffer: function() {
        var me = this,
            gl = me._gl,
            width = me._imageWidth,
            height = me._imageHeight,
            textureWidth = me._textureWidth,
            textureHeight = me._textureHeight,
            scaleH = width / textureWidth,
            scaleV = height / textureHeight,
            data = [
                0, scaleV,      scaleH, scaleV,
                0, 0 ,          scaleH, 0
            ];

        me._textureCoordinateBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, me._textureCoordinateBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    },

    _createTexture: function(imageData) {
        this._texture = new Texture(this._gl, imageData, TEXTURE_UNIT, {
            magFilter: this._gl.LINEAR,
            minFilter: this._gl.LINEAR_MIPMAP_NEAREST,
            flipY: true
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

    getImageWidth: function() {
        return this._imageWidth;
    },

    getImageHeight: function() {
        return this._imageHeight;
    },

    render: function() {
        var gl = this._gl;

        this._program.use(function() {
            this.uniform1i('u_Sampler', TEXTURE_UNIT);
        });

        this._updateProjectionMatrix();
        this._updateTransformationMatrix();
        this._rebindBuffers();
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },

    ready: function() {
        return this._readyPromise;
    },

    isReady: function() {
        return this._isReady;
    },

    destroy: function() {
        var gl = this._gl;

        this._program = utils.destroy(this._program);
        this._texture = utils.destroy(this._texture);

        if (this._vertexBuffer) {
            gl.deleteBuffer(this._vertexBuffer);
            this._vertexBuffer = null;
        }

        if (this._textureCoordinateBuffer) {
            gl.deleteBuffer(this._textureCoordinateBuffer);
            this._textureCoordinateBuffer = null;
        }
    }
});

module.exports = ImageLayer;

function loadImage(url) {
    var image = new Image();

    return new Promise(function(resolve, reject) {
        image.addEventListener('load', function() {
            resolve(image);
        });

        image.addEventListener('error', function() {
            reject(new Error('image load for ' + url + ' failed'));
        });

        image.src = url;
    });
}
