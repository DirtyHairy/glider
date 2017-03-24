import * as utils from './utils';
import ListenerGroup from './utils/ListenerGroup';
import Transformation from './Transformation';
import RenderControl from './RenderControl';
import Controls from './Controls';
import Controller from './Controller';
import * as rendererFactory from './renderer/factory';
import Collection from './utils/Collection';
import FeatureInteractionProvider from './FeatureInteractionProvider';

export default class Viewer {
    constructor(rendererType, canvas, imageUrl) {
        this._canvas = canvas;
        this._transformation = new Transformation();
        this._featureSets = new Collection();
        this._listeners = new ListenerGroup();
        this._renderer = rendererFactory.createRenderer(rendererType,
            canvas, imageUrl, this._transformation, this._featureSets);
        this._renderControl = new RenderControl(this._renderer);
        this._featureInteractionProvider = new FeatureInteractionProvider(
            this._featureSets,
            this._renderer.getPickingProvider()
        );
        this._controller = null;
        this._controls = null;

        this._listeners.add(this._renderer, 'render', this._onRender.bind(this));

        this._readyPromise = this._init();
    }

    _init() {
        return this._renderer.ready()
            .then(() => {
                this._controller = new Controller(this._renderControl, this._transformation);
                this._controls = new Controls(this._canvas, this._controller, this._featureInteractionProvider);

                this._renderControl.render();
            });
    }

    _onFeatureSetChange() {
        this._renderControl.render();
    }

    _onRender() {
        this._featureInteractionProvider.update();
    }

    getRenderer() {
        return this._renderer;
    }

    getCanvas() {
        return this._canvas;
    }

    getControls() {
        return this._controls;
    }

    getController() {
        return this._controller;
    }

    getTransformation() {
        return this._transformation;
    }

    addFeatureSet(featureSet) {
        const changeListener = this._onFeatureSetChange.bind(this, featureSet);

        this._featureSets.add(featureSet);

        this._listeners
            .add(featureSet, 'add', changeListener)
            .add(featureSet, 'remove', changeListener)
            .add(featureSet, 'change', changeListener);

        this._renderControl.render();

        return this;
    }

    removeFeatureSet(featureSet) {
        if (this._featureSets.remove(featureSet)) {
            this._listeners.removeTarget(featureSet);
            this._renderControl.render();
        }

        return this;
    }

    ready() {
        return this._readyPromise;
    }

    applyCanvasResize() {
        this._renderer.applyCanvasResize();
        this._controller.clampToScreen();
        this._renderControl.render();
    }

    destroy() {
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
}
