import Animation from '../animation/AnimationInterface';
import AnimationQueue from './AnimationQueue';
import Collection from '../utils/Collection';
import DependencyTracker from '../utils/DependencyTracker';
import FeatureSet from '../FeatureSet';
import ListenerGroup from '../utils/ListenerGroup';
import ImageLayer from './ImageLayer';
import {default as Observable, ObservableCollection} from '../utils/Observable';
import PickingManager from './PickingManager';
import Renderer from './Renderer';
import Transformation from '../Transformation';
import * as utils from '../utils';

abstract class AbstractRenderer<RenderFeatureSetT extends utils.Destroyable> implements Renderer {
    constructor(
        protected _canvas: HTMLCanvasElement,
        protected _imageUrl: string,
        protected _transformation: Transformation,
        protected _featureSets: Collection<FeatureSet>
    ) {
        Observable.delegate(this, this.observable);
        this._registerFeatureSets();
    }

    render(): this {
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

    getCanvas(): HTMLCanvasElement {
        return this._canvas;
    }

    applyCanvasResize(): this {
        return this;
    }

    addAnimation(animation: Animation): this {
        this._animations.add(animation);
        this._scheduleAnimations();

        return this;
    }

    removeAnimation(animation: Animation): this {
        this._animations.remove(animation);

        return this;
    }

    ready(): Promise<any> {
        return this._imageLayer.ready();
    }

    getPickingProvider(): PickingManager {
        return this._pickingManager;
    }

    destroy(): void {
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

    getImageWidth(): number {
        return this._imageLayer.getImageWidth();
    }

    getImageHeight(): number {
        return this._imageLayer.getImageHeight();
    }

    public abstract init(): this;

    protected abstract _renderImplementation(): void;

    protected abstract _createRenderFeatureSet(featureSet: FeatureSet): RenderFeatureSetT;

    private _immediateRender(): void {
        if (this._destroyed) {
            return;
        }

        if (this._renderImplementation()) {
            this.observable.render.fire();
        }
    }

    private _scheduleAnimations(): void {
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

    private _onFeatureSetAdded(featureSet: FeatureSet): void {
        this._renderFeatureSets.set(featureSet, this._createRenderFeatureSet(featureSet));
    }

    private _onFeatureSetRemoved(featureSet: FeatureSet): void {
        this._renderFeatureSets.get(featureSet).destroy();
        this._renderFeatureSets.delete(featureSet);
    }

    private _registerFeatureSets(): void {
        this._listeners.add(this._featureSets, 'add', this._onFeatureSetAdded.bind(this));
        this._listeners.add(this._featureSets, 'remove', this._onFeatureSetRemoved.bind(this));

        this._featureSets.forEach(this._onFeatureSetAdded.bind(this));
    }

    public observable: ObservableCollection = {
        render: new Observable()
    };

    protected _animations: AnimationQueue = new AnimationQueue();
    protected _animationFrameHandle: number = null;
    protected _dependencyTracker: DependencyTracker = new DependencyTracker();
    protected _listeners: ListenerGroup = new ListenerGroup();
    protected _renderFeatureSets: WeakMap<FeatureSet, RenderFeatureSetT> = new WeakMap();
    protected _renderPending: boolean = false;
    protected _destroyed: boolean = false;
    protected _pickingManager: PickingManager;
    protected _imageLayer: ImageLayer;
}

export default AbstractRenderer;
