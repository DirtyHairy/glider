import Collection from '../../utils/Collection';
import DependencyTracker from '../../utils/DependencyTracker';
import GlFeatureSet from './GlFeatureSet';
import Texture from './glutil/Texture';
import FrameBufferObject from './glutil/FrameBufferObject';
import PickingColorManager from './PickingColorManager';
import * as utils from '../../utils';
import ListenerGroup from '../../utils/ListenerGroup';
import PickingBuffer from './PickingBuffer';
import {default as FeatureSet, Feature} from '../../FeatureSet';
import TransformationMatrix from './TransformationMatrix';
import ProjectionMatrix from './ProjectionMatrix';

const TEXTURE_UNIT = 1;

class PickingManager {
    constructor(private _featureSets: Collection<FeatureSet>, private _glFeatureSets: WeakMap<FeatureSet, GlFeatureSet>,
                private _transformationMatrix: TransformationMatrix, private _projectionMatrix: ProjectionMatrix,
                private _width: number, private _height: number) {
    }

    init(gl: WebGLRenderingContext): this {
        this._gl = gl;
        this._pickingBuffer = new PickingBuffer(400, this._width, this._height, gl);

        this._setupFramebuffer();
        this._registerFeatureSets();

        return this;
    }

    public adjustViewportSize(width: number, height: number): this {
        this._width = width;
        this._height = height;

        this._texture.bind(TEXTURE_UNIT, (ctx) => ctx.loadPixelData(width, height, null));

        this._forceRedraw = true;

        this._pickingBuffer.adjustViewportSize(width, height);

        return this;
    }

    public getFeatureAt(x: number, y: number): Feature {
        const gl = this._gl;

        if (Math.abs(x) > this._width / 2  || Math.abs(y) > this._height / 2) {
            return null;
        }

        if (!this._render()) {
            this._fbo.bind();
        }

        let pixelData: Uint8Array;

        if (this._pickingBuffer.contains(x, y) || ++this._pickingBufferMiss > this._pickingBufferThreshold) {
            pixelData = this._pickingBuffer.read(x, y);
            this._pickingBufferMiss = 0;
        }

        if (!pixelData) {
            pixelData = new Uint8Array(4);
            gl.readPixels(Math.floor(x + this._width / 2), Math.floor(y + this._height / 2),
                1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);
        }

        // tslint:disable:no-bitwise
        const featureSetIdx = (pixelData[0] << 8) | pixelData[1],
            featureIdx = (pixelData[2] << 8) | pixelData[3],
            featureSet = (featureSetIdx > 0 && featureSetIdx <= this._featureSets.count()) ?
                this._featureSets.get(featureSetIdx - 1) : null,
            feature = (featureSet && featureIdx < featureSet.count()) ? featureSet.get(featureIdx) : null;
        // tslint:enable:no-bitwise

        return feature;
    }

    public isExpensive(x: number, y: number): boolean {
        return !this._pickingBuffer.contains(x, y);
    }

    public destroy(): void {
        this._fbo = utils.destroy(this._fbo);
        this._texture = utils.destroy(this._texture);
        this._pickingBuffer = utils.destroy(this._pickingBuffer);

        if (this._featureSets) {
            this._featureSets.forEach((featureSet) => this._colorManagers.delete(featureSet));

            this._listeners.removeTarget(this._featureSets);

            this._featureSets = null;
        }
    }

    private _setupFramebuffer(): void {
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

    private _onFeatureSetAdded(featureSet: FeatureSet): this {
        this._colorManagers.set(featureSet, new PickingColorManager(0));
        this._assignFeatureSetIndices();

        this._forceRedraw = true;

        return this;
    }

    private _onFeatureSetRemoved(featureSet: FeatureSet): void {
        this._colorManagers.delete(featureSet);
        this._assignFeatureSetIndices();

        this._forceRedraw = true;
    }

    private _registerFeatureSets(): void {
        this._listeners.add(this._featureSets, 'add', this._onFeatureSetAdded.bind(this));
        this._listeners.add(this._featureSets, 'remove', this._onFeatureSetRemoved.bind(this));

        this._featureSets.forEach(this._onFeatureSetAdded.bind(this));
    }

    private _assignFeatureSetIndices(): void {
        this._featureSets.forEach((featureSet, i) => {
            this._colorManagers.get(featureSet).setFeatureSetIndex(i);
        });
    }

    private _render(): boolean {
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

    private _gl: WebGLRenderingContext = null;
    private _dependencyTracker: DependencyTracker = new DependencyTracker();
    private _listeners: ListenerGroup = new ListenerGroup();
    private _colorManagers: WeakMap<FeatureSet, PickingColorManager> = new WeakMap();
    private _forceRedraw: boolean = true;
    private _pickingBuffer: PickingBuffer = null;
    private _pickingBufferMiss: number = 0;
    private _pickingBufferThreshold: number = 3;
    private _texture: Texture;
    private _fbo: FrameBufferObject;
}

export default PickingManager;
