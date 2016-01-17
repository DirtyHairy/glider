import Observable from '../../utils/Observable';
import DependencyTracker from '../../utils/DependencyTracker';
import ImageLayer from './ImageLayer';
import * as utils from '../../utils';

export default class Renderer {
    constructor(canvas, imageUrl, transformation, featureSets) {
        this._canvas = canvas;
        this._ctx = canvas.getContext('2d');
        this._imageUrl = imageUrl;
        this._transformation = transformation;
        this._featureSets = featureSets;
        this._imageLayer = new ImageLayer(this._ctx, imageUrl, canvas.width, canvas.height);
        this._dependencyTracker = new DependencyTracker();
        this._renderPending = false;

        this.observable = {
            render: new Observable()
        };
        Observable.delegate(this, this.observable);

        this._ctx.save();
    }

    _immediateRender() {
        this._dependencyTracker.update(this._transformation, () => {
            this._ctx.save();
            this._ctx.fillStyle = '#FFF';
            this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
            this._setupTransformation();
            this._imageLayer.render();
            this._ctx.restore();
        });
    }

    _setupTransformation() {

        const scale = this._transformation.getScale();
        this._ctx.translate(
            this._canvas.width / 2,
            this._canvas.height / 2
        );
        this._ctx.scale(scale, scale);
        this._ctx.translate(
            this._transformation.getTranslateX(),
            -this._transformation.getTranslateY()
        );
        
    }

    render() {
        if (this._renderPending || !this._imageLayer.isReady()) {
            return this;
        }

        this._renderPending = true;
        requestAnimationFrame(() => {
            this._immediateRender();
            this._renderPending = false;
        });

        return this;
    }

    getCanvas() {
        return this._canvas;
    }

    applyCanvasResize() {
        this._imageLayer.updateCanvasSize(this._canvas.width, this._canvas.height);

        return this;
    }

    addAnimation(animation) {
        return this;
    }

    removeAnimation(animation) {
        return this;
    }

    ready() {
        return this._imageLayer.ready();
    }

    getPickingProvider() {
        return {
            getFeatureAt: () => null,
            isExpensive: () => false
        };
    }

    getImageWidth() {
        return this._imageLayer.getWidth();
    }

    getImageHeight() {
        return this._imageLayer.getHeight();
    }

    destroy() {
        this._imageLayer = utils.destroy(this._imageLayer);
    }
}
