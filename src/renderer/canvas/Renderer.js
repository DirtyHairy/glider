import Observable from '../../utils/Observable';
import DependencyTracker from '../../utils/DependencyTracker';
import ImageLayer from './ImageLayer';
import AnimationQueue from '../AnimationQueue';
import * as utils from '../../utils';

export default class Renderer {
    constructor(canvas, imageUrl, transformation, featureSets) {
        this._canvas = canvas;
        this._ctx = canvas.getContext('2d');
        this._imageUrl = imageUrl;
        this._transformation = transformation;
        this._featureSets = featureSets;
        this._animations = new AnimationQueue();
        this._imageLayer = new ImageLayer(this._ctx, imageUrl, transformation, canvas.width, canvas.height);
        this._dependencyTracker = new DependencyTracker();
        this._renderPending = false;
        this._destroyed = false;
        this._forceRedraw = false;
        this._animationFrameHandle = null;

        this.observable = {
            render: new Observable()
        };
        Observable.delegate(this, this.observable);

        this._ctx.save();
    }

    _immediateRender() {
        if (this._destroyed) {
            return;
        }

        const exec = () => {
            this._ctx.fillStyle = '#FFF';
            this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
            this._imageLayer.render();
            this._forceRedraw = false;
        };

        if (this._forceRedraw) {
            exec();
        } else {
            this._dependencyTracker.update(this._transformation, exec);
        }
    }

    _scheduleAnimations() {
        if (this._animationFrameHandle) {
            return;
        }

        this._animationFrameHandle = requestAnimationFrame((timestamp) => {
            this._animationFrameHandle = null;

            this._animations.progress(timestamp);
            this._immediateRender();

            if (this._animations.count() > 0 && !this._destroyed) {
                this._scheduleAnimations();
            }
        });
    }

    render() {
        if (this._renderPending || !this._imageLayer.isReady() || this._destroyed || this._animations.count() > 0) {
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
        this._forceRedraw = true;

        return this;
    }

    addAnimation(animation) {
        this._animations.add(animation);
        this._scheduleAnimations();

        return this;
    }

    removeAnimation(animation) {
        this._animations.remove(animation);

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
        this._destroyed = true;
        this._imageLayer = utils.destroy(this._imageLayer);
    }
}
