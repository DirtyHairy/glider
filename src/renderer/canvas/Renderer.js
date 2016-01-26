import ImageLayer from './ImageLayer';
import RenderFeatureSet from './RenderFeatureSet';
import AbstractRenderer from '../AbstractRenderer';

export default class Renderer extends AbstractRenderer {
    _preInit(canvas) {
        this._ctx = canvas.getContext('2d');
        this._ctx.save();

        this._forceRedraw = true;
    }

    _createImageLayer(imageUrl) {
        return new ImageLayer(this._ctx, imageUrl, this._transformation, this._canvas);
    }

    _createPickingManager() {
        return {
            getFeatureAt: () => null,
            isExpensive: () => false
        };
    }

    _createRenderFeatureSet(featureSet) {
        return new RenderFeatureSet(this._ctx, featureSet, this._transformation, this._canvas);
    }

    _renderImplementation() {
        let didRender = false;

        const exec = () => {
            this._ctx.fillStyle = '#FFF';
            this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
            this._imageLayer.render();
            this._featureSets.forEach((featureSet) => this._renderFeatureSets.get(featureSet).render());
            this._forceRedraw = false;
            didRender = true;
        };

        if (this._forceRedraw) {
            exec();
        } else {
            this._dependencyTracker.updateAll(
                [this._transformation, ...this._featureSets.items()], exec);
        }

        return didRender;
    }

    applyCanvasResize() {
        AbstractRenderer.prototype.applyCanvasResize.apply(this);

        this._forceRedraw = true;

        return this;
    }
}
