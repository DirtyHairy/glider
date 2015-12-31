import * as utils from './utils';
import ListenerGroup from './utils/ListenerGroup';
import Transformation from './Transformation';
import RenderControl from './RenderControl';

const WebglRenderer = require('./renderer/webgl/Renderer'),
    Controller = require('./Controller'),
    Controls = require('./Controls');

export default class Viewer {
    constructor(canvas, imageUrl) {
        this._canvas = canvas;
        this._transformation = new Transformation();
        this._renderer = new WebglRenderer(canvas, imageUrl, this._transformation);
        this._renderControl = new RenderControl(this._renderer);
        this._featureSets = [];
        this._listeners = new ListenerGroup();
        this._controller = null;
        this._controls = null;

        this._readyPromise = this._init();
    }

    _init() {
        return this._renderer.ready()
            .then(() => {
                this._controller = new Controller(this._renderControl, this._transformation);
                this._controls = new Controls(this._canvas, this._controller);

                this._renderControl.render();
            });
    }

    _onFeatureSetChange() {
        this._renderControl.render();
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

        this._featureSets.push(featureSet);
        this._renderer.addFeatureSet(featureSet);

        this._listeners
            .add(featureSet, 'add', changeListener)
            .add(featureSet, 'remove', changeListener)
            .add(featureSet, 'change', changeListener);

        this._renderControl.render();

        return this;
    }

    removeFeatureSet(featureSet) {
        const i = this._featureSets.indexOf(featureSet);

        if (i >= 0) {
            this._featureSets.splice(i, 1);
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
        this._renderer = utils.destroy(this._renderer);
        this._controller = utils.destroy(this._controller);
        this._controls = utils.destroy(this._controls);
        this._transformation = utils.destroy(this._transformation);

        if (this._featureSets) {
            this._featureSets.forEach((featureSet) => {
                this._listeners.removeTarget(featureSet);
                utils.destroy(featureSet);
            });

            this._featureSets = null;
        }
    }

}

utils.delegate(Viewer.prototype, '_controller', [
    'getTranslateX', 'getTranslateY', 'getScale'
]);

utils.delegateFluent(Viewer.prototype, '_controller', [
    'translateAbsolute', 'translateRelative', 'rescale', 'rescaleAroundCenter'
]);

utils.delegateFluent(Viewer.prototype, '_renderControl', [
    'render', 'suspendRender', 'resumeRender', 'startBatch', 'commitBatch'
]);
