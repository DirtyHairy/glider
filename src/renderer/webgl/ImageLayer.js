import DependencyTracker from '../../utils/DependencyTracker';
import Program from './glutil/Program';
import Texture from './glutil/Texture';
import * as shader from './shader';
import * as utils from '../../utils';

const TEXTURE_UNIT = 0;

export default class ImageLayer {
    constructor(url, gl, projectionMatrix, transformationMatrix) {
        this._url = url;
        this._gl = gl;
        this._projectionMatrix = projectionMatrix;
        this._transformationMatrix = transformationMatrix;
        this._dependencyTracker = new DependencyTracker();
        this._program = new Program(gl, shader.vsh.imagelayer, shader.fsh.imagelayer);

        this._imageHeight = 0;
        this._imageWidth = 0;
        this._textureHeight = 0;
        this._textureWidth = 0;

        this._vertexBuffer = null;
        this._textureCoordinateBuffer = null;
        this._texture = null;

        this._isReady = false;

        this._readyPromise = this._init();
    }

    _init() {
        return this._loadImageData()
            .then((imageData) => {
                this._createTexture(imageData);
                this._createVertexBuffer();
                this._createTextureCoordinateBuffer();

                this._isReady = true;
            });
    }

    _loadImageData() {
        return loadImage(this._url)
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

                    return canvas;
                });
    }

    _createVertexBuffer() {
        const gl = this._gl,
            width = this._imageWidth,
            height = this._imageHeight,
            data = [
                -width/2, height/2,    width/2, height/2,
                -width/2, -height/2,   width/2, -height/2
            ];

        this._vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    }

    _createTextureCoordinateBuffer() {
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

    _createTexture(imageData) {
        this._texture = Texture.fromImageOrCanvas(this._gl, imageData, TEXTURE_UNIT, {
            magFilter: this._gl.LINEAR,
            minFilter: this._gl.LINEAR_MIPMAP_NEAREST,
            flipY: true
        });
    }

    _updateProjectionMatrix() {
        this._dependencyTracker.update(this._projectionMatrix, () => {
            this._program.use((ctx) => {
                ctx.uniformMatrix4fv('u_ProjectionMatrix', this._projectionMatrix.getMatrix());
            });
        });
    }

    _updateTransformationMatrix() {
        this._dependencyTracker.update(this._transformationMatrix, () => {
            this._program.use((ctx) => {
                ctx.uniformMatrix4fv('u_TransformationMatrix', this._transformationMatrix.getMatrix());
            });
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

        this._program.use((ctx) => {
            ctx.uniform1i('u_Sampler', TEXTURE_UNIT);
        });

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
}

function loadImage(url) {
    const image = new Image();

    return new Promise((resolve, reject) => {
        image.addEventListener('load', () => {
            resolve(image);
        });

        image.addEventListener('error', () => {
            reject(new Error('image load for ' + url + ' failed'));
        });

        image.src = url;
    });
}
