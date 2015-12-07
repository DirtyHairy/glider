var Hammer = require('hammerjs'),
    utils = require('./utils');

function Controls(canvas, controller) {
    this._canvas = canvas;
    this._controller = controller;
    this._manager = new Hammer.Manager(canvas);

    var pan = new Hammer.Pan({
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

    canvas.addEventListener('wheel', this._onWheel.bind(this));
}

utils.extend(Controls.prototype, {
    _controller: null,
    _canvas: null,
    _manager: null,

    _panning: false,
    _pinching: false,
    _oldScale: false,
    _oldTranslateX: 0,
    _oldTranslateY: 0,

    _onPan: function(e) {
        e.preventDefault();

        if (!this._panning) {
            return;
        }

        this._applyPan(e);
    },

    _onPanStart: function(e) {
        e.preventDefault();

        this._panning = true;
        this._oldTranslateX = this._controller.getTranslateX();
        this._oldTranslateY = this._controller.getTranslateY();

        this._applyPan(e);
    },

    _onPanEnd: function(e) {
        e.preventDefault();

        if (!this._panning) {
            return;
        }

        this._applyPan(e);
        this._panning = false;
    },

    _onPanCancel: function() {
        if (!this._panning) {
            return;
        }

        this._controller.translateAbsolute(this._oldTranslateX, this._oldTranslateY);
        this._panning = false;
    },

    _applyPan: function(e) {
        var scale = this._controller.getScale();

        this._controller.translateAbsolute(this._oldTranslateX + e.deltaX/scale, this._oldTranslateY + e.deltaY/scale);
    },

    _onPinch: function(e) {
        e.preventDefault();

        if (!this._pinching) {
            return;
        }

        this._applyPinch(e);
    },

    _onPinchStart: function(e) {
        e.preventDefault();

        this._pinching = true;
        this._oldTranslateX = this._controller.getTranslateX();
        this._oldTranslateY = this._controller.getTranslateY();
        this._oldScale = this._controller.getScale();

        this._applyPinch(e);
    },

    _onPinchEnd: function(e) {
        e.preventDefault();

        if (!this._pinching) {
            return;
        }

        this._applyPinch(e);
        this._pinching = false;
    },

    _onPinchCancel: function() {
        if (!this._pinching) {
            return;
        }

        this._controller
            .startBatch()
            .translateAbsolute(this._oldTranslateX, this._oldTranslateY)
            .rescale(this._oldScale)
            .commitBatch();

        this._pinching = false;
    },

    _applyPinch: function(e) {
        var newScale = this._oldScale * e.scale;

        this._controller
            .startBatch()
            .rescale(this._oldScale)
            .translateAbsolute(this._oldTranslateX + e.deltaX/this._oldScale, this._oldTranslateY + e.deltaY/this._oldScale);

        this._applyRescale(newScale, e.center.x, e.center.y);

        this._controller
            .rescaleAroundCenter(newScale, e.center.x/newScale, e.center.y/newScale)
            .commitBatch();
    },

    _onWheel: function(e) {
        var oldScale = this._controller.getScale(),
            newScale = oldScale - oldScale * e.deltaY / 500;

        this._applyRescale(newScale, e.clientX, e.clientY);
    },


    _onTap: function(e) {

        if (e.tapCount != 2) {
            return;
        }

        this._applyRescale(this._controller.getScale() * 1.3, e.center.x, e.center.y);
    },

    _applyRescale: function(scale, clientX, clientY) {
        var canvasRect = this._canvas.getBoundingClientRect();

        this._controller.rescaleAroundCenter(
            scale,
            (clientX - canvasRect.left - canvasRect.width / 2) / scale,
            (clientY - canvasRect.top - canvasRect.height / 2) / scale
        );
    }
});

module.exports = Controls;
