import DependencyTracker from '../../utils/DependencyTracker';
import GlFeatureSet from './GlFeatureSet';
import ImageLayer from './ImageLayer';
import PickingManager from './PickingManager';
import ProjectionMatrix from './ProjectionMatrix';
import TransformationMatrix from './TransformationMatrix';
import * as utils from '../../utils';
import ListenerGroup from '../../utils/ListenerGroup';
import Observable from '../../utils/Observable';
import AnimationQueue from '../AnimationQueue';

export default class Renderer {
    constructor(canvas, imageUrl, transformation, featureSets) {
        const gl = canvas.getContext('webgl', {
            alpha: false
        });

        this._gl = gl;
        this._canvas = canvas;
        this._transformation = transformation;
        this._animations = new AnimationQueue();
        this._animationFrameHandle = null;
        this._dependencyTracker = new DependencyTracker();
        this._listeners = new ListenerGroup();
        this._projectionMatrix = new ProjectionMatrix(canvas.width, canvas.heigth);
        this._transformationMatrix = new TransformationMatrix(transformation);
        this._featureSets = featureSets;
        this._glFeatureSets = new WeakMap();
        this._pickingManager = new PickingManager(
            this._gl, this._featureSets, this._glFeatureSets,
            this._transformationMatrix, this._projectionMatrix,
            canvas.width, canvas.height
        );
        this._imageLayer = new ImageLayer(imageUrl, this._gl, this._projectionMatrix, this._transformationMatrix);
        this._renderPending = false;
        this._destroyed = false;

        this.observable = {
            render: new Observable()
        };
        Observable.delegate(this, this.observable);

        this._registerFeatureSets();

        gl.disable(gl.DEPTH_TEST);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    _immediateRender() {
        const gl = this._gl;

        if (this._destroyed) {
            return;
        }

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

            this._featureSets.forEach((featureSet) => this._glFeatureSets.get(featureSet).render());

            this.observable.render.fire();
        });
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
        this._glFeatureSets.set(featureSet,
            new GlFeatureSet(this._gl, featureSet, this._projectionMatrix, this._transformationMatrix));
    }

    _onFeatureSetRemoved(featureSet) {
        this._glFeatureSets.get(featureSet).destroy();
        this._glFeatureSets.delete(featureSet);
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
        this._gl.viewport(0, 0, this._canvas.width, this._canvas.height);
        this._projectionMatrix
            .setWidth(this._canvas.width)
            .setHeight(this._canvas.height);

        this._pickingManager.adjustViewportSize(this._canvas.width, this._canvas.height);

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
        this._transformationMatrix = utils.destroy(this._transformationMatrix);
        this._projectionMatrix = utils.destroy(this._projectionMatrix);
        this._pickingManager = utils.destroy(this._pickingManager);

        if (this._featureSets) {
            this._featureSets.forEach((featureSet) => {
                utils.destroy(this._glFeatureSets.get(featureSet));
                this._glFeatureSets.delete(featureSet);
            });
            this._listeners.removeTarget(this._glFeatureSets);

            this._featureSets = null;
        }

        if (this._animationFrameHandle) {
            cancelAnimationFrame(this._animationFrameHandle);
            this._animationFrameHandle = null;
        }

        this._destroyed = true;
    }
}

utils.delegate(Renderer.prototype, '_imageLayer', ['getImageWidth', 'getImageHeight']);
