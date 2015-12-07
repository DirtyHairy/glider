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
    _clampRelativeBorder: 0.2,

    _render: function() {
        if (this._batchId > 0) {
            this._renderPending = true;
        } else {
            this._renderer.render();
        }
    },

    _clampTranslateX: function(dx) {
        var canvas = this._renderer.getCanvas(),
            canvasWidth = canvas.width/2,
            imageWidth = this._renderer.getImageWidth()/2,
            scale = this._renderer.getTransformation().getScale(),
            border = canvasWidth * this._clampRelativeBorder;

        if (canvasWidth - (dx - imageWidth)*scale < border) {
            return (canvasWidth - border)/scale + imageWidth;
        }

        if ((dx + imageWidth)*scale + canvasWidth < border) {
            return (border - canvasWidth)/scale - imageWidth;
        }

        return dx;
    },

    _clampTranslateY: function(dy) {
        var canvas = this._renderer.getCanvas(),
            canvasHeight = canvas.height/2,
            imageHeight = this._renderer.getImageHeight()/2,
            scale = this._renderer.getTransformation().getScale(),
            border = canvasHeight * this._clampRelativeBorder;

        if (canvasHeight - (dy - imageHeight)*scale < border) {
            return (canvasHeight - border)/scale + imageHeight;
        }

        if ((dy + imageHeight)*scale + canvasHeight < border) {
            return (border - canvasHeight)/scale - imageHeight;
        }

        return dy;
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

        t.setTranslateX(this._clampTranslateX(dx));
        t.setTranslateY(this._clampTranslateY(dy));

        this._render();

        return this;
    },

    translateRelative: function(dx, dy) {
        var t = this._renderer.getTransformation();

        t.setTranslateX(this._clampTranslateX(t.getTranslateX() + dx));
        t.setTranslateY(this._clampTranslateY(t.getTranslateY() + dy));

        this._render();

        return this;
    },

    clampToScreen: function() {
        var t = this._renderer.getTransformation(),
            dx = t.getTranslateX(),
            dy = t.getTranslateY(),
            cdx = this._clampTranslateX(dx),
            cdy = this._clampTranslateY(dy);

        if (dx === cdx && dy === cdy) {
            return;
        }

        this
            .translateAbsolute(cdx, cdy)
            ._render();
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
