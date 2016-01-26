import GlFeatureSet from './GlFeatureSet';
import ImageLayer from './ImageLayer';
import PickingManager from './PickingManager';
import ProjectionMatrix from './ProjectionMatrix';
import TransformationMatrix from './TransformationMatrix';
import * as utils from '../../utils';
import AbstractRenderer from '../AbstractRenderer';

export default class Renderer extends AbstractRenderer {
    _preInit(canvas, imageUrl, transformation) {
        const gl = canvas.getContext('webgl', {
            alpha: false
        });

        gl.disable(gl.DEPTH_TEST);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        this._gl = gl;
        this._projectionMatrix = new ProjectionMatrix(canvas.width, canvas.heigth);
        this._transformationMatrix = new TransformationMatrix(transformation);
    }

    _createImageLayer(imageUrl) {
        return new ImageLayer(imageUrl, this._gl, this._projectionMatrix, this._transformationMatrix);
    }

    _createPickingManager() {
        return new PickingManager(
            this._gl, this._featureSets, this._renderFeatureSets,
            this._transformationMatrix, this._projectionMatrix,
            this._canvas.width, this._canvas.height
        );
    }

    _createRenderFeatureSet(featureSet) {
        return new GlFeatureSet(this._gl, featureSet, this._projectionMatrix, this._transformationMatrix);
    }

    _renderImplementation() {
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
}
