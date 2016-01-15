import DependencyTracker from '../../utils/DependencyTracker';
import Texture from './glutil/Texture';
import FrameBufferObject from './glutil/FrameBufferObject';
import PickingColorManager from './PickingColorManager';
import * as utils from '../../utils';
import ListenerGroup from '../../utils/ListenerGroup';
import PickingBuffer from './PickingBuffer';

const TEXTURE_UNIT = 1;

export default class PickingManager {
    constructor(gl, featureSets, glFeatureSets, transformationMatrix, projectionMatrix, width, height) {
        this._gl = gl;
        this._dependencyTracker = new DependencyTracker();
        this._transformationMatrix = transformationMatrix;
        this._projectionMatrix = projectionMatrix;
        this._featureSets = featureSets;
        this._glFeatureSets = glFeatureSets;
        this._listeners = new ListenerGroup();
        this._colorManagers = new WeakMap();
        this._width = width;
        this._height = height;
        this._forceRedraw = true;
        this._pickingBuffer = new PickingBuffer(400, width, height, gl);
        this._pickingBufferMiss = 0;
        this._pickingBufferThreshold = 3;

        this._setupFramebuffer();
        this._registerFeatureSets();
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

    _onFeatureSetAdded(featureSet) {
        this._colorManagers.set(featureSet, new PickingColorManager(0));
        this._assignFeatureSetIndices();

        this._forceRedraw = true;

        return this;
    }

    _onFeatureSetRemoved(featureSet) {
        this._colorManagers.delete(featureSet);
        this._assignFeatureSetIndices();

        this._forceRedraw = true;
    }

    _registerFeatureSets() {
        this._listeners.add(this._featureSets, 'add', this._onFeatureSetAdded.bind(this));
        this._listeners.add(this._featureSets, 'remove', this._onFeatureSetRemoved.bind(this));

        this._featureSets.forEach(this._onFeatureSetAdded.bind(this));
    }

    _assignFeatureSetIndices() {
        this._featureSets.forEach((featureSet, i) => {
            this._colorManagers.get(featureSet).setFeatureSetIndex(i);
        });
    }

    _render() {
        const gl = this._gl;
        let redraw = false;

        const execute = () => {
            this._fbo.bind();

            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.disable(gl.BLEND);

            this._featureSets.forEach((featureSet) => {
                this._glFeatureSets.get(featureSet).renderPicking(this._colorManagers.get(featureSet));
            });

            this._pickingBuffer.invalidate();
            this._pickingBufferMiss = 0;

            this._dependencyTracker.setCurrent(this._projectionMatrix);
            this._dependencyTracker.setCurrent(this._transformationMatrix);
            this._dependencyTracker.setAllCurrent(this._featureSets.items());

            this._forceRedraw = false;

            redraw = true;
        };

        if (this._forceRedraw) {
            execute();
        } else {
            this._dependencyTracker.updateAll([
                    this._projectionMatrix,
                    this._transformationMatrix,
                    ...this._featureSets.items()
            ], execute);
        }

        return redraw;
    }

    adjustViewportSize(width, height) {
        this._width = width;
        this._height = height;

        this._texture.bind(TEXTURE_UNIT, (ctx) => ctx.loadPixelData(width, height, null));

        this._forceRedraw = true;

        this._pickingBuffer.adjustViewportSize(width, height);

        return this;
    }

    getFeatureAt(x, y) {
        const gl = this._gl;

        if (Math.abs(x) > this._width / 2  || Math.abs(y) > this._heigth / 2) {
            return null;
        }

        if (!this._render()) {
            this._fbo.bind();
        }

        var pixelData;

        if (this._pickingBuffer.contains(x, y) || ++this._pickingBufferMiss > this._pickingBufferThreshold) {
            pixelData = this._pickingBuffer.read(x, y);
            this._pickingBufferMiss = 0;
        }

        if (!pixelData) {
            pixelData = new Uint8Array(4);
            gl.readPixels(Math.floor(x + this._width / 2), Math.floor(y + this._height / 2),
                1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);
        }

        const featureSetIdx =     (pixelData[0] << 8) | pixelData[1],
            featureIdx =        (pixelData[2] << 8) | pixelData[3],
            featureSet = (featureSetIdx > 0 && featureSetIdx <= this._featureSets.count()) ?
                this._featureSets.get([featureSetIdx - 1]) : null,
            feature = (featureSet && featureIdx < featureSet.count()) ? featureSet.get(featureIdx) : null;

        return feature;
    }

    isExpensive(x, y) {
        return !this._pickingBuffer.contains(x, y);
    }

    destroy() {
        this._fbo = utils.destroy(this._fbo);
        this._texture = utils.destroy(this._texture);

        if (this._featureSets) {
            this._featureSets.forEach((featureSet) => this._colorManagers.delete(featureSet));

            this._listeners.removeTarget(this._featureSets);

            this._featureSets = null;
        }
    }
}
