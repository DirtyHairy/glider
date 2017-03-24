export default class Texture {
    constructor(public _gl: WebGLRenderingContext) {
        this._texture = _gl.createTexture();
        this._format = _gl.RGB;
        this._texelFormat = _gl.UNSIGNED_BYTE;
        this._textureUnits = getTextureUnits(_gl);
        this._mipmap = false;
        this._boundContext = new BoundContext(this);
    }

    static fromImageOrCanvas(
        gl: WebGLRenderingContext,
        imageData: HTMLImageElement | HTMLCanvasElement,
        textureUnit: number,
        options: TextureOptions
    ) {
        const texture = new Texture(gl);

        texture.bind(textureUnit, (ctx) => {
            ctx
                .reconfigure(options)
                .loadImageOrCanvas(imageData);
        });

        return texture;
    }

    static fromPixelData(
        gl: WebGLRenderingContext,
        width: number,
        heigth: number,
        pixelData: ArrayBufferView,
        textureUnit: number,
        options: TextureOptions
    ) {
        const texture = new Texture(gl);

        texture.bind(textureUnit, (ctx) => {
            ctx
                .reconfigure(options)
                .loadPixelData(width, heigth, pixelData);
        });

        return texture;
    }

    bind(textureUnit: number, cb?: (context: BoundContext) => void): this {
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

    getTextureObject(): WebGLTexture {
        return this._texture;
    }

    destroy(): void {
        const gl = this._gl;

        if (this._texture) {
            gl.deleteTexture(this._texture);
            this._texture = null;
        }
    }

    public _texture: WebGLTexture;
    public _format: number;
    public _texelFormat: number;
    public _textureUnits: Array<number>;
    public _mipmap: boolean;
    public _boundContext: BoundContext;
}

function getTextureUnits(gl: WebGLRenderingContext): Array<number> {
    const textureUnits = [];
    let i = 0;

    while (true) {
        let name = 'TEXTURE' + (i++);

        if (!(name in gl)) {
            break;
        }

        textureUnits.push((gl as any)[name] as number);
    }

    return textureUnits;
}

export interface TextureOptions {
    magFilter?: number;
    minFilter?: number;
    wrapS?: number;
    wrapT?: number;
    flipY?: number;
    texelFormat?: number;
    format?: number;
}

// tslint:disable-next-line:max-classes-per-file
export class BoundContext {
    constructor(private _texture: Texture) { }

    reconfigure(options: TextureOptions = {}) {
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

    loadImageOrCanvas(imageData: HTMLImageElement | HTMLCanvasElement): this {
        const gl = this._texture._gl;

        gl.texImage2D(gl.TEXTURE_2D, 0, this._texture._format, this._texture._format,
            this._texture._texelFormat, imageData);

        if (this._texture._mipmap) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        return this;
    }

    loadPixelData(width: number, height: number, pixelData: ArrayBufferView): this {
        const gl = this._texture._gl;

        gl.texImage2D(gl.TEXTURE_2D, 0, this._texture._format, width, height,
            0, this._texture._format, this._texture._texelFormat, pixelData);

        if (this._texture._mipmap) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        return this;
    }
}
