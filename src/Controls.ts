import * as Hammer from 'hammerjs';

import * as utils from './utils';
import Controller from './Controller';
import Animation from './Animation';
import FeatureInteractionProvider from './FeatureInteractionProvider';
import Point from './Point';

interface CanvasListener {
    (e: UIEvent): void;
}

export default class Controls {
    constructor(
        private _canvas: HTMLCanvasElement,
        private _controller: Controller,
        private _animation: Animation,
        private _featureInteractionProvider: FeatureInteractionProvider
    ) {
        this._manager = new Hammer.Manager(this._canvas);
        this._setupListeners();
    }

    destroy(): void {
        this._manager = utils.destroy(this._manager);

        if (this._canvasListeners) {
            Object.keys(this._canvasListeners).forEach(
                (event) => this._canvasListeners[event].forEach(
                    (listener) => this._canvas.removeEventListener(event, listener)
                )
            );
            this._canvasListeners = null;
        }
    }

    private _setupListeners(): void {
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
        this._manager.on('pancancel', this._onPanCancel.bind(this));

        this._manager.on('pinch', this._onPinch.bind(this));
        this._manager.on('pinchstart', this._onPinchStart.bind(this));
        this._manager.on('pinchend', this._onPinchEnd.bind(this));
        this._manager.on('pinchcancel', this._onPinchCancel.bind(this));

        this._manager.on('doubletap', this._onTap.bind(this));

        this._registerCanvasListener('wheel', this._onWheel.bind(this));
        this._registerCanvasListener('mousemove', this._onMouseMove.bind(this));

        // Prevent browser mouse emulation
        ['touchstart', 'touchend', 'touchmove'].forEach(
            (evt) => this._registerCanvasListener(evt, (e: UIEvent) => e.preventDefault())
        );
    }

    private _registerCanvasListener(event: string, listener: CanvasListener): void {
        if (!this._canvasListeners[event]) {
            this._canvasListeners[event] = [];
        }

        this._canvasListeners[event].push(listener);
        this._canvas.addEventListener(event, listener);
    }

    private _onPan(e: HammerInput): void {
        e.preventDefault();

        if (!this._panning) {
            return;
        }

        this._applyPan(e);
    }

    private _onPanStart(e: HammerInput): void {
        e.preventDefault();

        this._panning = true;
        this._oldTranslateX = this._controller.getTranslateX();
        this._oldTranslateY = this._controller.getTranslateY();

        this._animation.stopKineticTranslate();
        this._applyPan(e);
    }

    private _onPanEnd(e: HammerInput): void {
        e.preventDefault();

        if (!this._panning) {
            return;
        }

        const scale = this._controller.getScale();

        this._applyPan(e);
        this._animation.kineticTranslate(e.velocityX / scale, -e.velocityY / scale);

        this._panning = false;
    }

    private _onPanCancel(): void {
        if (!this._panning) {
            return;
        }

        this._controller.translateAbsolute(this._oldTranslateX, this._oldTranslateY);
        this._panning = false;
    }

    private _applyPan(e: HammerInput): void {
        const scale = this._controller.getScale();

        this._controller.translateAbsolute(
            this._oldTranslateX + e.deltaX / scale,
            this._oldTranslateY - e.deltaY / scale
        );
    }

    private _onPinch(e: HammerInput): void {
        e.preventDefault();

        if (!this._pinching) {
            return;
        }

        this._applyPinch(e);
    }

    private _onPinchStart(e: HammerInput): void {
        e.preventDefault();

        this._pinching = true;
        this._oldTranslateX = this._controller.getTranslateX();
        this._oldTranslateY = this._controller.getTranslateY();
        this._oldScale = this._controller.getScale();

        this._animation.stopKineticTranslate();
        this._applyPinch(e);
    }

    private _onPinchEnd(e: HammerInput): void {
        e.preventDefault();

        if (!this._pinching) {
            return;
        }

        const scale = this._controller.getScale();

        this._applyPinch(e);
        this._animation.kineticTranslate(e.velocityX / scale, -e.velocityY / scale);

        this._pinching = false;
    }

    private _onPinchCancel(): void {
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

    private _applyPinch(e: HammerInput): void {
        const newScale = this._oldScale * e.scale;

        this._controller
            .startBatch()
            .rescale(this._oldScale)
            .translateAbsolute(
                this._oldTranslateX + e.deltaX / this._oldScale,
                this._oldTranslateY - e.deltaY / this._oldScale
            );

        this._applyRescale(newScale, e.center.x, e.center.y);

        this._controller.commitBatch();
    }

    private _onWheel(e: WheelEvent): void {
        const oldScale = this._controller.getScale(),
            newScale = oldScale - oldScale * e.deltaY / 500;

        this._applyRescale(newScale, e.clientX, e.clientY);
    }

    private _onTap(e: HammerInput): void {
        switch ((e as any).tapCount) {
            case 1:
                return this._applyClick(e.center.x, e.center.y);

            case 2:
                return this._applyRescale(this._controller.getScale() * 1.3, e.center.x, e.center.y);

            default:
        }
    }

    private _translateClientCoordinates(clientX: number, clientY: number): Point {
        const canvasRect = this._canvas.getBoundingClientRect();

        return {
            x: (clientX - canvasRect.left - canvasRect.width / 2),
            y: -(clientY - canvasRect.top - canvasRect.height / 2)
        };
    }

    private _applyRescale(scale: number, clientX: number, clientY: number): void {
        const {x, y} = this._translateClientCoordinates(clientX, clientY);

        this._controller.rescaleAroundCenter(scale, x / scale, y / scale);
    }

    private _applyClick(clientX: number, clientY: number): void {
        const {x, y} = this._translateClientCoordinates(clientX, clientY);

        this._featureInteractionProvider.click(x, y);
    }

    private _onMouseMove(e: PointerEvent): void {
        const {x, y} = this._translateClientCoordinates(e.clientX, e.clientY);

        this._featureInteractionProvider.update(x, y);
    }

    private _manager: HammerManager;
    private _canvasListeners: {[event: string]: Array<CanvasListener>} = {};
    private _panning = false;
    private _pinching = false;
    private _oldScale = 0;
    private _oldTranslateX = 0;
    private _oldTranslateY = 0;
}
