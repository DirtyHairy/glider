import * as utils from './utils';
import ListenerGroup from './utils/ListenerGroup';
import Transformation from './Transformation';
import RenderControl from './RenderControl';
import Controls from './Controls';
import Controller from './Controller';
import {Type as RendererType, createRenderer} from './renderer/factory';
import Collection from './utils/Collection';
import FeatureInteractionProvider from './FeatureInteractionProvider';
import Animation from './Animation';
import Renderer  from './renderer/Renderer';
import FeatureSet from './FeatureSet';

// tslint:disable:member-ordering

export default class Viewer {
    constructor(
        rendererType: RendererType,
        private _canvas: HTMLCanvasElement,
        imageUrl: string
    ) {
        this._renderer = createRenderer(
            rendererType,
            this._canvas,
            imageUrl,
            this._transformation,
            this._featureSets
        );

        this._renderControl = new RenderControl(this._renderer);

        this._featureInteractionProvider = new FeatureInteractionProvider(
            this._featureSets,
            this._renderer.getPickingProvider()
        );

        this._listeners.add(this._renderer, 'render', this._onRender.bind(this));

        this._readyPromise = this._init();
    }

    private _init(): Promise<any> {
        return this._renderer.ready()
            .then(() => {
                this._controller = new Controller(this._renderControl, this._transformation);
                this._animation = new Animation(this._controller, this._renderer);
                this._controls = new Controls(
                    this._canvas,
                    this._controller,
                    this._animation,
                    this._featureInteractionProvider
                );

                this._renderControl.render();
            });
    }

    private _onFeatureSetChange(): void {
        this._renderControl.render();
    }

    private _onRender(): void {
        this._featureInteractionProvider.update();
    }

    getRenderer(): Renderer {
        return this._renderer;
    }

    getCanvas(): HTMLCanvasElement {
        return this._canvas;
    }

    getControls(): Controls {
        return this._controls;
    }

    getController(): Controller {
        return this._controller;
    }

    getTransformation(): Transformation {
        return this._transformation;
    }

    addFeatureSet(featureSet: FeatureSet): this {
        const changeListener = this._onFeatureSetChange.bind(this, featureSet);

        this._featureSets.add(featureSet);

        this._listeners
            .add(featureSet, 'add', changeListener)
            .add(featureSet, 'remove', changeListener)
            .add(featureSet, 'change', changeListener);

        this._renderControl.render();

        return this;
    }

    removeFeatureSet(featureSet: FeatureSet): this {
        if (this._featureSets.remove(featureSet)) {
            this._listeners.removeTarget(featureSet);
            this._renderControl.render();
        }

        return this;
    }

    ready(): Promise<any> {
        return this._readyPromise;
    }

    applyCanvasResize(): void {
        this._renderer.applyCanvasResize();
        this._controller.clampToScreen();
        this._renderControl.render();
    }

    destroy(): void {
        if (this._renderer) {
            this._listeners.removeTarget(this._renderer);
        }
        this._renderer = utils.destroy(this._renderer);

        this._controller = utils.destroy(this._controller);
        this._controls = utils.destroy(this._controls);
        this._transformation = utils.destroy(this._transformation);
        this._featureInteractionProvider = utils.destroy(this._featureInteractionProvider);
        this._renderControl = utils.destroy(this._renderControl);

        if (this._featureSets) {
            this._featureSets.forEach((featureSet) => {
                this._listeners.removeTarget(featureSet);
                utils.destroy(featureSet);
            });

            this._featureSets = utils.destroy(this._featureSets);
        }
    }

    private _transformation = new Transformation();
    private _featureSets = new Collection<FeatureSet>();
    private _listeners = new ListenerGroup();

    private _renderer: Renderer = null;
    private _renderControl: RenderControl = null;
    private _featureInteractionProvider: FeatureInteractionProvider = null;
    private _controller: Controller = null;
    private _controls: Controls = null;
    private _animation: Animation = null;

    private _readyPromise: Promise<any> = null;
}
