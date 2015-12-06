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

    stopBatch: function() {
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

    panAbsolute: function(panX, panY) {
        var t = this._renderer.getTransformation(),
            scale = t.getScale();

        t.setTranslateX(panX / scale);
        t.setTranslateY(panY / scale);

        this._render();

        return this;
    },

    panRelative: function(dx, dy) {
        var t = this._renderer.getTransformation(),
            scale = t.getScale();

        t.setTranslateX(t.getTranslateX() + dx / scale);
        t.setTranslateY(t.getTranslateY() + dy / scale);

        this._render();

        return this;
    },

    getPanX: function() {
        var t = this._renderer.getTransformation();

        return t.getTranslateX() * t.getScale();
    },

    getPanY: function() {
        var t = this._renderer.getTransformation();

        return t.getTranslateY() * t.getScale();
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
            .panRelative(centerX * fac, centerY * fac)
            .stopBatch();
    },

    getScale: function() {
        return this._renderer.getTransformation().getScale();
    }
});

module.exports = Controller;
