export default class Texture {
    constructor(gl) {
        const texture = gl.createTexture();

        this._gl = gl;
        this._texture = texture;
        this._format = gl.RGB;
        this._texelFormat = gl.UNSIGNED_BYTE;
        this._textureUnits = getTextureUnits(gl);
        this._mipmap = false;
        this._boundContext = new BoundContext(this);
    }

    bind(textureUnit, cb) {
        const gl = this._gl;

        if (typeof(textureUnit) !== 'undefined') {
            gl.activeTexture(this._textureUnits[textureUnit]);
        }

        gl.bindTexture(gl.TEXTURE_2D, this._texture);

        if (cb) {
            cb(this._boundContext);
        }

        return this;
    }

    getTextureObject() {
        return this._texture;
    }

    destroy() {
        var gl = this._gl;

        if (this._texture) {
            gl.deleteTexture(this._texture);
            this._texture = null;
        }
    }

    static fromImageOrCanvas(gl, imageData, textureUnit, options) {
        const texture = new Texture(gl);

        texture.bind(textureUnit, (ctx) => {
            ctx
                .reconfigure(options)
                .loadImageOrCanvas(imageData);
        });

        return texture;
    }

    static fromPixelData(gl, width, heigth, pixelData, textureUnit, options) {
        const texture = new Texture(gl);

        texture.bind(textureUnit, (ctx) => {
            ctx
                .reconfigure(options)
                .loadPixelData(width, heigth, pixelData);
        });

        return texture;
    }
}

function getTextureUnits(gl) {
    const textureUnits = [];
    let i = 0;

    while (true) {
        let name = 'TEXTURE' + (i++);

        if (!(name in gl)) {
            break;
        }

        textureUnits.push(gl[name]);
    }

    return textureUnits;
}

class BoundContext {
    constructor(texture) {
        this._texture = texture;
    }

    reconfigure(options = {}) {
        const gl = this._texture._gl;

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
    }

    loadImageOrCanvas(imageData) {
        const gl = this._texture._gl;

        gl.texImage2D(gl.TEXTURE_2D, 0, this._texture._format, this._texture._format,
            this._texture._texelFormat, imageData);

        if (this._texture._mipmap) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        return this;
    }

    loadPixelData(width, height, pixelData) {
        const gl = this._texture._gl;

        gl.texImage2D(gl.TEXTURE_2D, 0, this._texture._format, width, height,
            0, this._texture._format, this._texture._texelFormat, pixelData);

        if (this._texture._mipmap) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        return this;
    }
}
