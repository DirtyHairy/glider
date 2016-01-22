import Observable from '../../utils/Observable';
import DependencyTracker from '../../utils/DependencyTracker';
import ImageLayer from './ImageLayer';
import AnimationQueue from '../AnimationQueue';
import RenderFeatureSet from './RenderFeatureSet';
import ListenerGroup from '../../utils/ListenerGroup';
import * as utils from '../../utils';

export default class Renderer {
    constructor(canvas, imageUrl, transformation, featureSets) {
        this._canvas = canvas;
        this._ctx = canvas.getContext('2d');
        this._imageUrl = imageUrl;
        this._transformation = transformation;
        this._featureSets = featureSets;
        this._animations = new AnimationQueue();
        this._imageLayer = new ImageLayer(this._ctx, imageUrl, transformation, canvas);
        this._dependencyTracker = new DependencyTracker();
        this._renderPending = false;
        this._destroyed = false;
        this._forceRedraw = false;
        this._animationFrameHandle = null;
        this._renderFeatureSets = new WeakMap();
        this._listeners = new ListenerGroup();

        this.observable = {
            render: new Observable()
        };
        Observable.delegate(this, this.observable);

        this._ctx.save();
        this._registerFeatureSets();
    }

    _immediateRender() {
        if (this._destroyed) {
            return;
        }

        const exec = () => {
            this._ctx.fillStyle = '#FFF';
            this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
            this._imageLayer.render();
            this._featureSets.forEach((featureSet) => this._renderFeatureSets.get(featureSet).render());
            this._forceRedraw = false;
        };

        if (this._forceRedraw) {
            exec();
        } else {
            this._dependencyTracker.updateAll(
                [this._transformation, ...this._featureSets.items()], exec);
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

    _onFeatureSetAdded(featureSet) {
        this._renderFeatureSets.set(featureSet, new RenderFeatureSet(
            this._ctx, featureSet, this._transformation, this._canvas));
    }

    _onFeatureSetRemoved(featureSet) {
        this._renderFeatureSets.delete(featureSet);
    }

    _registerFeatureSets() {
        this._listeners.add(this._featureSets, 'add', this._onFeatureSetAdded.bind(this));
        this._listeners.add(this._featureSets, 'remove', this._onFeatureSetRemoved.bind(this));

        this._featureSets.forEach((featureSet) => this._onFeatureSetAdded(featureSet));
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
        this._featureSets.forEach((featureSet) => this._renderFeatureSets.delete(featureSet));
    }
}
