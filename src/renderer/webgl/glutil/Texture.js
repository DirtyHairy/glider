var utils = require('../../../utils');

function Texture(gl, imageData, textureUnit, options) {
    options = options || {};
    var texture = gl.createTexture();

    this._gl = gl;
    this._texture = texture;

    this.bind(textureUnit);

    if (options.hasOwnProperty('magFilter')) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, options.magFilter);
    }

    if (options.hasOwnProperty('minFilter')) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, options.minFilter);
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

    var format = options.hasOwnProperty('format') ? options.format : gl.RGB,
        texelFormat = options.hasOwnProperty('texelFormat') ? options.texelFormat : gl.UNSIGNED_BYTE;
    gl.texImage2D(gl.TEXTURE_2D, 0, format, format, texelFormat, imageData);

    if (options.hasOwnProperty('minFilter') && options.minFilter === gl.LINEAR_MIPMAP_NEAREST) {
        gl.generateMipmap(gl.TEXTURE_2D);
    }
}

utils.extend(Texture.prototype, {
    _gl: null,
    _texture: null,

    bind: function(textureUnit) {
        var gl = this._gl;

        gl.activeTexture(gl['TEXTURE' + textureUnit]);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
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
