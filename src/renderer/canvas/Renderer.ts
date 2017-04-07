import FeatureSet from '../../FeatureSet';
import ImageLayer from './ImageLayer';
import RenderFeatureSet from './RenderFeatureSet';
import AbstractRenderer from '../AbstractRenderer';
import PickingManager from '../PickingManager';

// tslint:disable:member-ordering

export default class Renderer extends AbstractRenderer<RenderFeatureSet> {
    init() {
        this._ctx = this._canvas.getContext('2d');
        this._ctx.save();

        this._pickingManager = this._createPickingManager();
        this._imageLayer = this._createImageLayer(this._imageUrl);

        return this;
    }

    private _createImageLayer(imageUrl: string): ImageLayer {
        return new ImageLayer(this._ctx, imageUrl, this._transformation, this._canvas);
    }

    private _createPickingManager(): PickingManager {
        return {
            getFeatureAt: () => null,
            isExpensive: () => false
        };
    }

    protected _createRenderFeatureSet(featureSet: FeatureSet): RenderFeatureSet {
        return new RenderFeatureSet(this._ctx, featureSet, this._transformation, this._canvas);
    }

    protected _renderImplementation(): boolean {
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

    applyCanvasResize(): this {
        AbstractRenderer.prototype.applyCanvasResize.apply(this);

        this._forceRedraw = true;

        return this;
    }

    protected _imageLayer: ImageLayer;

    private _ctx: CanvasRenderingContext2D;
    private _forceRedraw: boolean = true;
}
