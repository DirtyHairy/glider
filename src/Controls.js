var Hammer = require('hammerjs'),
    utils = require('./utils');

function Controls(canvas, controller) {
    this._canvas = canvas;
    this._controller = controller;
    this._manager = new Hammer.Manager(canvas);

    this._manager.add(new Hammer.Pan({
        event: 'pan',
        threshold: 0
    }));

    this._manager.on('pan', this._onPan.bind(this));
    this._manager.on('panstart', this._onPanStart.bind(this));
    this._manager.on('panend', this._onPanEnd.bind(this));
    this._manager.on('pancancel', this._onPanCancel(this));

    canvas.addEventListener('wheel', this._onWheel.bind(this));
}

utils.extend(Controls.prototype, {
    _controller: null,
    _canvas: null,
    _manager: null,

    _panning: false,
    _oldPanX: 0,
    _oldPanY: 0,

    _onPan: function(e) {
        if (!this._panning) {
            return;
        }

        this._applyPan(e);
    },

    _onPanStart: function(e) {
        this._panning = true;
        this._oldPanX = this._controller.getPanX();
        this._oldPanY = this._controller.getPanY();

        this._applyPan(e);
    },

    _onPanEnd: function(e) {
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

    _onWheel: function(e) {
        var oldScale = this._controller.getScale(),
            canvasRect = this._canvas.getBoundingClientRect(),
            scale = oldScale - oldScale * e.deltaY / 500;

        this._controller.rescaleAroundCenter(
            scale,
            e.clientX - canvasRect.left - canvasRect.width / 2,
            e.clientY - canvasRect.top - canvasRect.height / 2
        );
    }
});

module.exports = Controls;
