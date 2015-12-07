var utils = require('./utils');

function Controller(renderer) {
    this._renderer = renderer;
}

utils.extend(Controller.prototype, {
    _renderer: null,

    _batchId: 0,
    _renderPending: false,

    _scaleMin: 0.1,
    _scaleMax: 10,

    _render: function() {
        if (this._batchId > 0) {
            this._renderPending = true;
        } else {
            this._renderer.render();
        }
    },

    startBatch: function() {
        this._batchId++;

        return this;
    },

    commitBatch: function() {
        if (this._batchId <= 0) {
            return;
        }

        this._batchId--;

        if (this._batchId === 0 && this._renderPending) {
            this._renderer.render();
            this._renderPending = false;
        }

        return this;
    },

    translateAbsolute: function(dx, dy) {
        var t = this._renderer.getTransformation();

        t.setTranslateX(dx);
        t.setTranslateY(dy);

        this._render();

        return this;
    },

    translateRelative: function(dx, dy) {
        var t = this._renderer.getTransformation();

        t.setTranslateX(t.getTranslateX() + dx);
        t.setTranslateY(t.getTranslateY() + dy);

        this._render();

        return this;
    },

    getTranslateX: function() {
        return this._renderer.getTransformation().getTranslateX();
    },

    getTranslateY: function() {
        return this._renderer.getTransformation().getTranslateY();
    },

    rescale: function(scale) {
        this._renderer.getTransformation().setScale(utils.clamp(scale, this._scaleMin, this._scaleMax));

        this._render();

        return this;
    },

    rescaleAroundCenter: function(scale, centerX, centerY) {
        scale = utils.clamp(scale, this._scaleMin, this._scaleMax);

        var t = this._renderer.getTransformation(),
            oldScale = t.getScale(),
            fac = 1 - scale/oldScale;

        this
            .startBatch()
            .rescale(scale)
            .translateRelative(centerX * fac, centerY * fac)
            .commitBatch();

        return this;
    },

    getScale: function() {
        return this._renderer.getTransformation().getScale();
    }
});

module.exports = Controller;
