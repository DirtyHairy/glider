import * as utils from './utils';
import * as Hammer from 'hammerjs';

export default class Controls {
    constructor(canvas, controller, featureInteractionProvider) {
        this._canvas = canvas;
        this._controller = controller;
        this._manager = new Hammer.Manager(canvas);
        this._canvasListeners = {};
        this._featureInteractionProvider = featureInteractionProvider;

        this._panning = false;
        this._pinching = false;
        this._oldScale = false;
        this._oldTranslateX = 0;
        this._oldTranslateY = 0;

        this._setupListeners();
    }

    _setupListeners() {
        let pan = new Hammer.Pan({
                event: 'pan',
                threshold: 1
            }),
            pinch = new Hammer.Pinch({
                event: 'pinch'
            }),
            tap = new Hammer.Tap({
                event: 'doubletap',
                threshold: 100,
                posThreshold: 100,
                interval: 200
            });

        pan.requireFailure(tap);
        pinch.requireFailure(tap);

        this._manager.add(pan);
        this._manager.add(pinch);
        this._manager.add(tap);

        this._manager.on('pan', this._onPan.bind(this));
        this._manager.on('panstart', this._onPanStart.bind(this));
        this._manager.on('panend', this._onPanEnd.bind(this));
        this._manager.on('pancancel', this._onPanCancel(this));

        this._manager.on('pinch', this._onPinch.bind(this));
        this._manager.on('pinchstart', this._onPinchStart.bind(this));
        this._manager.on('pinchend', this._onPinchEnd.bind(this));
        this._manager.on('pinchcancel', this._onPinchCancel.bind(this));

        this._manager.on('doubletap', this._onTap.bind(this));

        this._registerCanvasListener('wheel', this._onWheel.bind(this));
        this._registerCanvasListener('mousemove', this._onMouseMove.bind(this));

        // Prevent browser mouse emulation
        ['touchstart', 'touchend', 'touchmove'].forEach(
            (evt) => this._registerCanvasListener(evt, (e) => e.preventDefault())
        );
    }

    _registerCanvasListener(event, listener) {
        if (!this._canvasListeners[event]) {
            this._canvasListeners[event] = [];
        }

        this._canvasListeners[event].push(listener);
        this._canvas.addEventListener(event, listener);
    }

    _onPan(e) {
        e.preventDefault();

        if (!this._panning) {
            return;
        }

        this._applyPan(e);
    }

    _onPanStart(e) {
        e.preventDefault();

        this._panning = true;
        this._oldTranslateX = this._controller.getTranslateX();
        this._oldTranslateY = this._controller.getTranslateY();

        this._controller.stopKineticTranslate();
        this._applyPan(e);
    }

    _onPanEnd(e) {
        e.preventDefault();

        if (!this._panning) {
            return;
        }

        const scale = this._controller.getScale();

        this._applyPan(e);
        this._controller.kineticTranslate(e.velocityX / scale, -e.velocityY / scale);

        this._panning = false;
    }

    _onPanCancel() {
        if (!this._panning) {
            return;
        }

        this._controller.translateAbsolute(this._oldTranslateX, this._oldTranslateY);
        this._panning = false;
    }

    _applyPan(e) {
        const scale = this._controller.getScale();

        this._controller.translateAbsolute(this._oldTranslateX + e.deltaX/scale, this._oldTranslateY - e.deltaY/scale);
    }

    _onPinch(e) {
        e.preventDefault();

        if (!this._pinching) {
            return;
        }

        this._applyPinch(e);
    }

    _onPinchStart(e) {
        e.preventDefault();

        this._pinching = true;
        this._oldTranslateX = this._controller.getTranslateX();
        this._oldTranslateY = this._controller.getTranslateY();
        this._oldScale = this._controller.getScale();

        this._controller.stopKineticTranslate();
        this._applyPinch(e);
    }

    _onPinchEnd(e) {
        e.preventDefault();

        if (!this._pinching) {
            return;
        }

        const scale = this._controller.getScale();

        this._applyPinch(e);
        this._controller.kineticTranslate(e.velocityX / scale, -e.velocityY / scale);

        this._pinching = false;
    }

    _onPinchCancel() {
        if (!this._pinching) {
            return;
        }

        this._controller
            .startBatch()
            .translateAbsolute(this._oldTranslateX, this._oldTranslateY)
            .rescale(this._oldScale)
            .commitBatch();

        this._pinching = false;
    }

    _applyPinch(e) {
        const newScale = this._oldScale * e.scale;

        this._controller
            .startBatch()
            .rescale(this._oldScale)
            .translateAbsolute(this._oldTranslateX + e.deltaX/this._oldScale, this._oldTranslateY - e.deltaY/this._oldScale);

        this._applyRescale(newScale, e.center.x, e.center.y);

        this._controller.commitBatch();
    }

    _onWheel(e) {
        const oldScale = this._controller.getScale(),
            newScale = oldScale - oldScale * e.deltaY / 500;

        this._applyRescale(newScale, e.clientX, e.clientY);
    }

    _onTap(e) {
        switch (e.tapCount) {
            case 1:
                return this._applyClick(e.center.x, e.center.y);

            case 2:
                return this._applyRescale(this._controller.getScale() * 1.3, e.center.x, e.center.y);

            default:
        }
    }

    _translateClientCoordinates(clientX, clientY) {
        const canvasRect = this._canvas.getBoundingClientRect();

        return {
            x: (clientX - canvasRect.left - canvasRect.width / 2),
            y: -(clientY - canvasRect.top - canvasRect.height / 2)
        };
    }

    _applyRescale(scale, clientX, clientY) {
        const {x, y} = this._translateClientCoordinates(clientX, clientY);

        this._controller.rescaleAroundCenter(scale, x / scale, y / scale);
    }

    _applyClick(clientX, clientY) {
        const {x, y} = this._translateClientCoordinates(clientX, clientY);

        this._featureInteractionProvider.click(x, y);
    }

    _onMouseMove(e) {
        const {x, y} = this._translateClientCoordinates(e.clientX, e.clientY);

        this._featureInteractionProvider.update(x, y);
    }

    destroy() {
        this._manager = utils.destroy(this._manager);

        if (this._canvasListeners) {
            Object.keys(this._canvasListeners).forEach(
                (event) => this._canvasListeners[event].forEach(
                    (listener) => this._canvas.removeEventListener(event, listener)
                )
            );
            this._canvasListener = null;
        }
    }
}
