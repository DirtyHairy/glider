var utils = require('./utils');

function KineticTranslate(controller, velocityX, velocityY, timeConstant) {
    this._controller = controller;
    this._velocityX = velocityX;
    this._velocityY = velocityY;
    this._timeConstant = timeConstant;

    this._originalTranslateX = controller.getTranslateX();
    this._originalTranslateY = controller.getTranslateY();
}

utils.extend(KineticTranslate.prototype, {
    controller: null,
    _velocityX: 0,
    _velocityY: 0,
    _timeConstant: 1,

    _originalTranslateX: 0,
    _originalTranslateY: 0,

    _finished: false,
    _startTimestamp: -1,
    _lastTimestamp: -1,

    progress: function(timestamp) {
        if (this._finished) {
            return;
        }

        if (this._startTimestamp < 0) {
            this._startTimestamp = this._lastTimestamp = timestamp;
            return;
        }

        var totalDelta = timestamp - this._startTimestamp,
            delta = timestamp - this._lastTimestamp,
            factor = Math.exp(-totalDelta / this._timeConstant),
            dx = factor * this._velocityX * delta,
            dy = factor * this._velocityY * delta;

        this._lastTimestamp = timestamp;


        if (Math.abs(factor * this._velocityX) < 0.01 && Math.abs(factor * this._velocityY) < 0.01) {
            this._finished = true;
        } else {
            this._controller
                .suspendRender()
                .translateRelative(dx, dy)
                .resumeRender();
        }
    },

    finished: function() {
        return this._finished;
    },

    render: function() {
        return !this._finished;
    },

    cancel: function() {
        this._finished = true;
    }
});

module.exports = KineticTranslate;
