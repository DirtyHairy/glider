var utils = require('./utils'),
    KineticTranslate = require('./KineticTranslate');

function Controller(renderControl, transformation) {
    this._renderControl = renderControl;
    this._transformation = transformation;
}

utils.extend(Controller.prototype, {
    _renderControl: null,

    _scaleMin: 0.1,
    _scaleMax: 10,
    _clampRelativeBorder: 0.2,
    _kindeticTranslateTimeConstant: 325,

    _kineticTranslate: null,

    _clampTranslateX: function(dx) {
        var renderer = this._renderControl.getRenderer(),
            canvas = renderer.getCanvas(),
            canvasWidth = canvas.width/2,
            imageWidth = renderer.getImageWidth()/2,
            scale = this._transformation.getScale(),
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
        var renderer = this._renderControl.getRenderer(),
            canvas = renderer.getCanvas(),
            canvasHeight = canvas.height/2,
            imageHeight = renderer.getImageHeight()/2,
            scale = this._transformation.getScale(),
            border = canvasHeight * this._clampRelativeBorder;

        if (canvasHeight - (dy - imageHeight)*scale < border) {
            return (canvasHeight - border)/scale + imageHeight;
        }

        if ((dy + imageHeight)*scale + canvasHeight < border) {
            return (border - canvasHeight)/scale - imageHeight;
        }

        return dy;
    },

    translateAbsolute: function(dx, dy) {
        var t = this._transformation;

        t.setTranslateX(this._clampTranslateX(dx));
        t.setTranslateY(this._clampTranslateY(dy));

        this._renderControl.render();

        return this;
    },

    translateRelative: function(dx, dy) {
        var t = this._transformation;

        t.setTranslateX(this._clampTranslateX(t.getTranslateX() + dx));
        t.setTranslateY(this._clampTranslateY(t.getTranslateY() + dy));

        this._renderControl.render();

        return this;
    },

    kineticTranslate: function(velocityX, velocityY) {
        this.stopKineticTranslate();

        this._kineticTranslate = new KineticTranslate(
            this, velocityX, velocityY, this._kindeticTranslateTimeConstant
        );

        this._renderControl.getRenderer().addAnimation(this._kineticTranslate);

        return this;
    },

    stopKineticTranslate: function() {
        if (this._kineticTranslate) {
            this._kineticTranslate.cancel();
        }
    },

    clampToScreen: function() {
        var t = this._transformation,
            dx = t.getTranslateX(),
            dy = t.getTranslateY(),
            cdx = this._clampTranslateX(dx),
            cdy = this._clampTranslateY(dy);

        if (dx === cdx && dy === cdy) {
            return;
        }

        this.translateAbsolute(cdx, cdy);
    },

    getTranslateX: function() {
        return this._transformation.getTranslateX();
    },

    getTranslateY: function() {
        return this._transformation.getTranslateY();
    },

    rescale: function(scale) {
        this._transformation.setScale(utils.clamp(scale, this._scaleMin, this._scaleMax));

        this._renderControl.render();

        return this;
    },

    rescaleAroundCenter: function(scale, centerX, centerY) {
        scale = utils.clamp(scale, this._scaleMin, this._scaleMax);

        var t = this._transformation,
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
        return this._transformation.getScale();
    }
});

utils.delegateFluent(Controller.prototype, '_renderControl', [
    'startBatch', 'commitBatch', 'suspendRender', 'resumeRender'
]);

module.exports = Controller;
