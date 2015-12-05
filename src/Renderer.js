var q = require('q'),
    glmatrix = require('gl-matrix'),
    utils = require('./utils'),
    Program = require('./glutil/Program'),
    Texture = require('./glutil/Texture');

var fs = require('fs');

var imageLayerVertexShaderSource =
        fs.readFileSync(__dirname + '/shader/imagelayer.vsh').toString(),
    imageLayerFragmentShaderSource =
        fs.readFileSync(__dirname + '/shader/imagelayer.fsh').toString();

var TEXTURE_UNIT = 0;

function Renderer(canvas, imageUrl) {
    var me = this;

    me._canvas = canvas;
    me._gl = canvas.getContext('webgl');
    me._imageUrl = imageUrl;
}

utils.extend(Renderer.prototype, {
    _canvas: null,
    _imageUrl: null,
    _imageData: null,
    _gl: null,

    _imageWidth: null,
    _imageHeight: null,

    _program: null,
    _vertexBuffer: null,
    _textureCoordinateBuffer: null,
    _texture: null,

    _scale: 0.4,

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

        me._program.use(function() {
            this.enableVertexAttribArray('a_VertexPosition');
            this.vertexAttribPointer('a_VertexPosition', 2, gl.FLOAT);
        });

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

        me._program.use(function() {
            this.enableVertexAttribArray('a_TextureCoordinate');
            this.vertexAttribPointer('a_TextureCoordinate', 2, gl.FLOAT);
        });

        return textureCoordinateBuffer;
    },

    _updateProjectionMatrix: function() {
        var width = this._canvas.width,
            height = this._canvas.height,
            matrix = glmatrix.mat4.create();

        glmatrix.mat4.ortho(matrix, -width/2, width/2, -height/2, height/2, 0, 1);

        this._program.use(function() {
            this.uniformMatrix4fv('u_ProjectionMatrix', matrix);
        });
    },

    _updateTransformationMatrix: function() {
        var matrix = glmatrix.mat4.create();

        glmatrix.mat4.scale(matrix, matrix, [this._scale, this._scale, 1]);

        this._program.use(function() {
            this.uniformMatrix4fv('u_TransformationMatrix', matrix);
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
                me._texture = new Texture(me._gl, imageData, TEXTURE_UNIT, {
                    magFilter: me._gl.LINEAR,
                    minFilter: me._gl.LINEAR_MIPMAP_NEAREST,
                    flipY: true
                });

                me._vertexBuffer = me._createVertexBuffer();
                me._textureCoordinateBuffer = me._createTextureCoordinateBuffer();
                me._updateProjectionMatrix();
                me._updateTransformationMatrix();
            });
    },

    render: function() {
        var gl = this._gl;

        this._program.use(function() {
            this.uniform1i('u_Sampler', TEXTURE_UNIT);
        });

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
});

module.exports = Renderer;

function loadImage(url) {
    var image = new Image(),
        deferred = q.defer();

    image.addEventListener('load', function() {
        deferred.resolve(image);
    });

    image.addEventListener('error', function() {
        deferred.reject(new Error('image load for ' + url + ' failed'));
    });

    image.src = url;

    return deferred.promise;
}
