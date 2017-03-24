import AnimationQueue from './AnimationQueue';
import DependencyTracker from '../utils/DependencyTracker';
import ListenerGroup from '../utils/ListenerGroup';
import Observable from '../utils/Observable';
import * as utils from '../utils';

export default class AbstractRenderer {
    constructor(canvas, imageUrl, transformation, featureSets) {
        this._preInit(canvas, imageUrl, transformation, featureSets);

        this._canvas = canvas;
        this._transformation = transformation;
        this._animations = new AnimationQueue();
        this._animationFrameHandle = null;
        this._dependencyTracker = new DependencyTracker();
        this._listeners = new ListenerGroup();
        this._featureSets = featureSets;
        this._renderFeatureSets = new WeakMap();
        this._renderPending = false;
        this._destroyed = false;

        this.observable = {
            render: new Observable()
        };
        Observable.delegate(this, this.observable);

        this._pickingManager = this._createPickingManager();
        this._imageLayer = this._createImageLayer(imageUrl);

        this._registerFeatureSets();
    }

    _immediateRender() {
        if (this._destroyed) {
            return;
        }

        if (this._renderImplementation()) {
            this.observable.render.fire();
        }
    }

    _scheduleAnimations() {
        if (this._animationFrameHandle !== null) {
            return;
        }

        this._animationFrameHandle = requestAnimationFrame((timestamp) => {
            this._animationFrameHandle = null;

            this._animations.progress(timestamp);
            this._immediateRender();

            if (this._animations.count() > 0 && ! this._destroyed) {
                this._scheduleAnimations();
            }
        });
    }

    _onFeatureSetAdded(featureSet) {
        this._renderFeatureSets.set(featureSet, this._createRenderFeatureSet(featureSet));
    }

    _onFeatureSetRemoved(featureSet) {
        this._renderFeatureSets.get(featureSet).destroy();
        this._renderFeatureSets.delete(featureSet);
    }

    _registerFeatureSets() {
        this._listeners.add(this._featureSets, 'add', this._onFeatureSetAdded.bind(this));
        this._listeners.add(this._featureSets, 'remove', this._onFeatureSetRemoved.bind(this));

        this._featureSets.forEach(this._onFeatureSetAdded.bind(this));
    }

    render() {
        if (!this._imageLayer.isReady() || this._renderPending || this._animations.count() > 0 || this._destroyed) {
            return this;
        }

        requestAnimationFrame(() => {
            this._renderPending = false;
            this._immediateRender();
        });

        this._renderPending = true;

        return this;
    }

    getCanvas() {
        return this._canvas;
    }

    applyCanvasResize() {
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
        return this._pickingManager;
    }

    destroy() {
        this._imageLayer = utils.destroy(this._imageLayer);
        this._pickingManager = utils.destroy(this._pickingManager);

        if (this._featureSets) {
            this._featureSets.forEach((featureSet) => {
                utils.destroy(this._renderFeatureSets.get(featureSet));
                this._renderFeatureSets.delete(featureSet);
            });
            this._listeners.removeTarget(this._renderFeatureSets);

            this._featureSets = null;
        }

        if (this._animationFrameHandle) {
            cancelAnimationFrame(this._animationFrameHandle);
            this._animationFrameHandle = null;
        }

        this._destroyed = true;
    }

    getImageWidth() {
        return this._imageLayer.getImageWidth();
    }

    getImageHeight() {
        return this._imageLayer.getImageHeight();
    }

    _createImageLayer(imageUrl) { //jshint ignore: line
        throw new Error('not implemented');
    }

    _createPickingManager() {
        throw new Error('not implemented');
    }

    _renderImplementation() {
        throw new Error('not implemented');
    }

    _createRenderFeatureSet(featureSet) { // jshint ignore: line
        throw new Error('not implemented');
    }

    _preInit() {
    }
}
