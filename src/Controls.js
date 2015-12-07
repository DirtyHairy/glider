var Hammer = require('hammerjs'),
    utils = require('./utils');

function Controls(canvas, controller) {
    this._canvas = canvas;
    this._controller = controller;
    this._manager = new Hammer.Manager(canvas);

    this._manager.add(new Hammer.Pan({
        event: 'pan',
        threshold: 2
    }));

    this._manager.add(new Hammer.Pinch({
        event: 'pinch'
    }));

    this._manager.add(new Hammer.Tap({
        event: 'doubletap'
    }));

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
    _oldPanX: 0,
    _oldPanY: 0,

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
        this._oldPanX = this._controller.getPanX();
        this._oldPanY = this._controller.getPanY();

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

        this._controller.panAbsolute(this._oldPanX, this._oldPanY);
        this._panning = false;
    },

    _applyPan: function(e) {
        this._controller.panAbsolute(this._oldPanX + e.deltaX, this._oldPanY + e.deltaY);
    },

    _onPinch: function(e) {
        e.preventDefault();

        if (!this._pinching) {
            return;
        }

        this._applyPinch(e);
    },

    _onPinchMove: function(e) {
        e.preventDefault();

        if (!this._pinching) {
            return;
        }

        this._applyPan(e);
    },

    _onPinchStart: function(e) {
        e.preventDefault();

        this._pinching = true;
        this._oldPanX = this._controller.getPanX();
        this._oldPanY = this._controller.getPanY();
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
            .panAbsolute(this._oldPanX, this._oldPanY)
            .rescale(this._oldScale)
            .commitBatch();

        this._pinching = false;
    },

    _applyPinch: function(e) {
        this._controller
            .startBatch()
            .rescale(this._oldScale);

        this._applyPan(e);
        this._applyRescale(this._oldScale * e.scale, e.center.x, e.center.y);

        this._controller.commitBatch();
    },

    _onWheel: function(e) {
        var oldScale = this._controller.getScale();

        this._applyRescale(oldScale - oldScale * e.deltaY / 500, e.clientX, e.clientY);
    },

    _applyRescale: function(scale, clientX, clientY) {
        var canvasRect = this._canvas.getBoundingClientRect();

        this._controller.rescaleAroundCenter(
            scale,
            clientX - canvasRect.left - canvasRect.width / 2,
            clientY - canvasRect.top - canvasRect.height / 2
        );
    },

    _onTap: function(e) {
        if (e.tapCount != 2) {
            return;
        }

        this._applyRescale(this._controller.getScale() * 1.3, e.center.x, e.center.y);
    }
});

module.exports = Controls;
