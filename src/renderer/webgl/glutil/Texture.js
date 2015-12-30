var utils = require('../../../utils');

function Texture(gl) {
    var texture = gl.createTexture();

    this._gl = gl;
    this._texture = texture;
    this._format = gl.RGB;
    this._texelFormat = gl.UNSIGNED_BYTE;
    this._boundContext = new BoundContext(this);

    this._getTextureUnits();
}

utils.extend(Texture, {
    fromImageOrCanvas: function(gl, imageData, textureUnit, options) {
        var texture = new Texture(gl);

        texture.bind(textureUnit, function(ctx) {
            ctx
                .reconfigure(options)
                .loadImageOrCanvas(imageData);
        });

        return texture;
    },

    fromPixelData: function(gl, width, heigth, pixelData, textureUnit, options) {
        var texture = new Texture(gl);

        texture.bind(textureUnit, function(ctx) {
            ctx
                .reconfigure(options)
                .loadPixelData(width, heigth, pixelData);
        });

        return texture;
    }
});

utils.extend(Texture.prototype, {
    _gl: null,
    _texture: null,
    _mipmap: false,
    _boundContext: null,
    _textureUnits: null,

    _getTextureUnits: function() {
        var gl = this._gl,
            i = 0,
            name;

        this._textureUnits = [];

        while (true) {
            name = 'TEXTURE' + (i++);

            if (!(name in gl)) {
                break;
            }

            this._textureUnits.push(gl[name]);
        }
    },

    bind: function(textureUnit, cb) {
        var gl = this._gl;

        if (typeof(textureUnit) !== 'undefined') {
            gl.activeTexture(this._textureUnits[textureUnit]);
        }

        gl.bindTexture(gl.TEXTURE_2D, this._texture);

        if (cb) {
            cb(this._boundContext);
        }

        return this;
    },

    getTextureObject: function() {
        return this._texture;
    },

    destroy: function() {
        var gl = this._gl;

        if (this._texture) {
            gl.deleteTexture(this._texture);
            this._texture = null;
        }
    }
});

module.exports = Texture;

function BoundContext(texture) {
    this._texture = texture;
}

utils.extend(BoundContext.prototype, {
    reconfigure: function(options) {
        var gl = this._texture._gl;

        options = options || {};

        if (options.hasOwnProperty('magFilter')) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, options.magFilter);
        }

        if (options.hasOwnProperty('minFilter')) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, options.minFilter);
            this._texture._mipmap = (options.minFilter === gl.LINEAR_MIPMAP_NEAREST);
        }

        if (options.hasOwnProperty('wrapS')) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, options.wrapS);
        }

        if (options.hasOwnProperty('wrapT')) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, options.wrapT);
        }

        if (options.hasOwnProperty('flipY')) {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, options.flipY);
        }

        if (options.hasOwnProperty('texelFormat')) {
            this._texture._texelFormat = options.texelFormat;
        }

        if (options.hasOwnProperty('format')) {
            this._texture._format = options.format;
        }

        return this;
    },

    loadImageOrCanvas: function(imageData) {
        var gl = this._texture._gl;

        gl.texImage2D(gl.TEXTURE_2D, 0, this._texture._format, this._texture._format,
            this._texture._texelFormat, imageData);

        if (this._texture._mipmap) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        return this;
    },

    loadPixelData: function(width, height, pixelData) {
        var gl = this._texture._gl;

        gl.texImage2D(gl.TEXTURE_2D, 0, this._texture._format, width, height,
            0, this._texture._format, this._texture._texelFormat, pixelData);

        if (this._texture._mipmap) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        return this;
    }
});
