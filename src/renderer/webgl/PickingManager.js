import DependencyTracker from '../../utils/DependencyTracker';
import Texture from './glutil/Texture';
import FrameBufferObject from './glutil/FrameBufferObject';
import PickingColorManager from './PickingColorManager';
import * as utils from '../../utils';

const TEXTURE_UNIT = 1;

export default class PickingManager {
    constructor(gl, transformationMatrix, projectionMatrix, width, height, glFeatureSets) {
        this._gl = gl;
        this._dependencyTracker = new DependencyTracker();
        this._transformationMatrix = transformationMatrix;
        this._projectionMatrix = projectionMatrix;
        this._featureSets = [];
        this._glFeatureSets = glFeatureSets;
        this._colorManagers = new WeakMap();
        this._width = width;
        this._height = height;
        this._forceRedraw = true;

        this._setupFramebuffer();
    }

    _setupFramebuffer() {
        const gl = this._gl,
            fbo = new FrameBufferObject(gl),
            texture = Texture.fromPixelData(gl, this._width, this._height, null, TEXTURE_UNIT, {
            format: gl.RGBA,
            texelFormat: gl.UNSIGNED_BYTE,
            minFilter: gl.NEAREST,
            magFilter: gl.NEAREST,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE
        });

        fbo.bind((ctx) => {
            ctx
                .attachColorTexture(texture, TEXTURE_UNIT)
                .validate();
        });

        this._texture = texture;
        this._fbo = fbo;
    }

    _assignFeatureSetIndices() {
        this._featureSets.forEach((featureSet, i) => {
            this._colorManagers.get(featureSet).setFeatureSetIndex(i);
        });
    }

    _render() {
        const gl = this._gl;

        if (!this._forceRedraw &&
                this._dependencyTracker.isCurrent(this._projectionMatrix) &&
                this._dependencyTracker.isCurrent(this._transformationMatrix) &&
                this._dependencyTracker.allCurrent(this._featureSets)
            )
        {
            return false;
        }

        this._fbo.bind();

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.BLEND);

        this._featureSets.forEach((featureSet) => {
            this._glFeatureSets.get(featureSet).renderPicking(this._colorManagers.get(featureSet));
        });

        this._forceRedraw = false;

        return true;
    }

    adjustViewportSize(width, height) {
        this._width = width;
        this._height = height;

        this._texture.bind(TEXTURE_UNIT, (ctx) => {
            ctx.loadPixelData(width, height, null);
        });

        this._forceRedraw = true;

        return this;
    }

    addFeatureSet(featureSet) {
        this._featureSets.push(featureSet);
        this._colorManagers.set(featureSet, new PickingColorManager(0));
        this._assignFeatureSetIndices();

        this._forceRedraw = true;

        return this;
    }

    removeFeatureSet(featureSet) {
        const i = this._featureSets.indexOf(featureSet);

        if (i >= 0) {
            this._featureSets.splice(i, 1);
            this._colorManagers.delete(featureSet);
            this._assignFeatureSetIndices();

            this._forceRedraw = true;
        }

        return this;
    }

    getFeatureAt(x, y) {
        const gl = this._gl;

        if (x < 0 || x > this._width || y < 0 || y > this._height) {
            return null;
        }

        if (!this._render()) {
            this._fbo.bind();
        }

        const pixelData = new Uint8Array(4);

        gl.readPixels(x + this._width / 2, y + this._height / 2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);

        const featureSetIdx =     (pixelData[0] << 8) | pixelData[1],
            featureIdx =        (pixelData[2] << 8) | pixelData[3],
            featureSet = (featureSetIdx > 0 && featureSetIdx <= this._featureSets.length) ?
                this._featureSets[featureSetIdx - 1] : null,
            feature = (featureSet && featureIdx < featureSet.count()) ? featureSet.get(featureIdx) : null;

        return feature;
    }

    destroy() {
        this._fbo = utils.destroy(this._fbo);
        this._texture = utils.destroy(this._texture);

        if (this._featureSets) {
            this._featureSets.forEach((featureSet) => {
                this._colorManagers.delete(featureSet);
            });

            this._featureSets = null;
        }
    }
}
