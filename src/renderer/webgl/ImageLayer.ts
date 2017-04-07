import DependencyTracker from '../../utils/DependencyTracker';
import Program from './glutil/Program';
import Texture from './glutil/Texture';
import ProjectionMatrix from './ProjectionMatrix';
import TransformationMatrix from './TransformationMatrix';
import * as shader from './shader';
import * as utils from '../../utils';

const TEXTURE_UNIT = 0;

export default class ImageLayer {
    constructor(
        private _url: string,
        private _projectionMatrix: ProjectionMatrix,
        private _transformationMatrix: TransformationMatrix
     ) {}

    init(gl: WebGLRenderingContext): this {
        this._gl = gl;
        this._program = new Program(gl, shader.vsh.imagelayer, shader.fsh.imagelayer);

        this._readyPromise = this._loadImageData()
            .then((imageData) => {
                this._createTexture(imageData);
                this._createVertexBuffer();
                this._createTextureCoordinateBuffer();

                this._isReady = true;
            });

        return this;
    }

    _loadImageData(): Promise<HTMLCanvasElement> {
        return utils.loadImage(this._url)
            .then((image) => {
                    const paddedWidth = Math.pow(2, Math.floor(Math.log(image.width) / Math.log(2)) + 1),
                        paddedHeight = Math.pow(2, Math.floor(Math.log(image.width) / Math.log(2)) + 1),
                        canvas = document.createElement('canvas'),
                        ctx = canvas.getContext('2d');

                    canvas.width = this._textureWidth = paddedWidth;
                    canvas.height = this._textureHeight = paddedHeight;

                    this._imageWidth = image.width;
                    this._imageHeight = image.height;

                    ctx.drawImage(image,
                        0, 0, image.width, image.height,
                        0, paddedHeight - image.height, image.width, image.height);

                    // Simulate CLAMP_TO_EDGE for the open ends of the padded texture ---
                    // otherwise, sampling at the edges will give a frame effect.
                    for (let i = 0; i < paddedWidth - image.width; i++) {
                        ctx.drawImage(image,
                            image.width - 1, 0, 1, image.height,
                            image.width + i, paddedHeight - image.height, 1, image.height);
                    }

                    // dito
                    for (let i = 0; i < paddedHeight - image.height; i++) {
                        ctx.drawImage(image,
                            0, 0, image.width, 1,
                            0, paddedHeight - image.height - i, image.width, 1
                        );
                    }

                    // dito --- the top right corner fully degenerates to the color
                    // of the top right pixel
                    let topRightPixel =
                        ctx.getImageData(image.width - 1, paddedHeight - image.height, 1, 1).data;
                    ctx.fillStyle = `rgb(${topRightPixel[0]},${topRightPixel[1]},${topRightPixel[2]})`;
                    ctx.fillRect(image.width, 0, paddedWidth - image.width, paddedHeight - image.height);

                    return canvas;
                });
    }

    _createVertexBuffer(): void {
        const gl = this._gl,
            width = this._imageWidth,
            height = this._imageHeight,
            data = [
                -width / 2, height / 2,    width / 2, height / 2,
                -width / 2, -height / 2,   width / 2, -height / 2
            ];

        this._vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    }

    _createTextureCoordinateBuffer(): void {
        const gl = this._gl,
            width = this._imageWidth,
            height = this._imageHeight,
            textureWidth = this._textureWidth,
            textureHeight = this._textureHeight,
            scaleH = width / textureWidth,
            scaleV = height / textureHeight,
            data = [
                0, scaleV,      scaleH, scaleV,
                0, 0 ,          scaleH, 0
            ];

        this._textureCoordinateBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._textureCoordinateBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    }

    _createTexture(imageData: HTMLImageElement | HTMLCanvasElement): void {
        this._texture = Texture.fromImageOrCanvas(this._gl, imageData, TEXTURE_UNIT, {
            magFilter: this._gl.LINEAR,
            minFilter: this._gl.LINEAR_MIPMAP_NEAREST,
            wrapS: this._gl.CLAMP_TO_EDGE,
            wrapT: this._gl.CLAMP_TO_EDGE,
            flipY: true
        });
    }

    _updateProjectionMatrix() {
        this._dependencyTracker.update(this._projectionMatrix, () => {
            this._program.use((ctx) =>
                ctx.uniformMatrix4fv('u_ProjectionMatrix', this._projectionMatrix.getMatrix()));
        });
    }

    _updateTransformationMatrix() {
        this._dependencyTracker.update(this._transformationMatrix, () => {
            this._program.use((ctx) =>
                ctx.uniformMatrix4fv('u_TransformationMatrix', this._transformationMatrix.getMatrix()));
        });
    }

    _rebindBuffers() {
        const gl = this._gl;

        this._program.use((ctx) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
            ctx.enableVertexAttribArray('a_VertexPosition');
            ctx.vertexAttribPointer('a_VertexPosition', 2, gl.FLOAT);

            gl.bindBuffer(gl.ARRAY_BUFFER, this._textureCoordinateBuffer);
            ctx.enableVertexAttribArray('a_TextureCoordinate');
            ctx.vertexAttribPointer('a_TextureCoordinate', 2, gl.FLOAT);
        });
    }

    getImageWidth() {
        return this._imageWidth;
    }

    getImageHeight() {
        return this._imageHeight;
    }

    render() {
        const gl = this._gl;

        this._texture.bind(TEXTURE_UNIT);

        this._program.use((ctx) => ctx.uniform1i('u_Sampler', TEXTURE_UNIT));

        this._updateProjectionMatrix();
        this._updateTransformationMatrix();
        this._rebindBuffers();
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    ready() {
        return this._readyPromise;
    }

    isReady() {
        return this._isReady;
    }

    destroy() {
        const gl = this._gl;

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

        private _gl: WebGLRenderingContext = null;
        private _dependencyTracker = new DependencyTracker();
        private _program: Program = null;

        private _imageHeight = 0;
        private _imageWidth = 0;
        private _textureHeight = 0;
        private _textureWidth = 0;

        private _vertexBuffer: WebGLBuffer = null;
        private _textureCoordinateBuffer: WebGLBuffer = null;
        private _texture: Texture;

        private _isReady = false;
        private _readyPromise: Promise<any> = null;
}
