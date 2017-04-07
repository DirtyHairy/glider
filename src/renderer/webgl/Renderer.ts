import GlFeatureSet from './GlFeatureSet';
import ImageLayer from './ImageLayer';
import PickingManager from './PickingManager';
import ProjectionMatrix from './ProjectionMatrix';
import TransformationMatrix from './TransformationMatrix';
import FeatureSet from '../../FeatureSet';
import * as utils from '../../utils';
import AbstractRenderer from '../AbstractRenderer';

// tslint:disable:member-ordering

export default class Renderer extends AbstractRenderer<GlFeatureSet> {

    init(): this {
        const gl = this._canvas.getContext('webgl', {
            alpha: false
        });

        gl.disable(gl.DEPTH_TEST);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        this._gl = gl;
        this._projectionMatrix = new ProjectionMatrix(this._canvas.width, this._canvas.height);
        this._transformationMatrix = new TransformationMatrix(this._transformation);

        this._pickingManager = this._createPickingManager().init(this._gl);
        this._imageLayer = this._createImageLayer(this._imageUrl).init(this._gl);

        return this;
    }

    private _createImageLayer(imageUrl: string): ImageLayer {
        return new ImageLayer(imageUrl, this._projectionMatrix, this._transformationMatrix);
    }

    private _createPickingManager(): PickingManager {
        return new PickingManager(
            this._featureSets, this._renderFeatureSets,
            this._transformationMatrix, this._projectionMatrix,
            this._canvas.width, this._canvas.height
        );
    }

    protected _createRenderFeatureSet(featureSet: FeatureSet): GlFeatureSet {
        return new GlFeatureSet(this._gl, featureSet, this._projectionMatrix, this._transformationMatrix);
    }

    protected _renderImplementation(): boolean {
        const gl = this._gl;

        let didRender = false;

        this._dependencyTracker.updateAll([
            this._projectionMatrix,
            this._transformationMatrix,
            ...this._featureSets.items()
        ], () => {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.clearColor(1, 1, 1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.disable(gl.BLEND);
            this._imageLayer.render();

            gl.enable(gl.BLEND);

            this._featureSets.forEach((featureSet) => this._renderFeatureSets.get(featureSet).render());

            didRender = true;
        });

        return didRender;
    }

    applyCanvasResize() {
        AbstractRenderer.prototype.applyCanvasResize.apply(this);

        this._gl.viewport(0, 0, this._canvas.width, this._canvas.height);
        this._projectionMatrix
            .setWidth(this._canvas.width)
            .setHeight(this._canvas.height);

        this._pickingManager.adjustViewportSize(this._canvas.width, this._canvas.height);

        return this;
    }

    destroy() {
        AbstractRenderer.prototype.destroy.apply(this);

        this._transformationMatrix = utils.destroy(this._transformationMatrix);
        this._projectionMatrix = utils.destroy(this._projectionMatrix);
    }

    protected _imageLayer: ImageLayer;
    protected _pickingManager: PickingManager;

    private _gl: WebGLRenderingContext = null;
    private _projectionMatrix: ProjectionMatrix = null;
    private _transformationMatrix: TransformationMatrix = null;
}
