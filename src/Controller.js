import KineticTranslate from './KineticTranslate';
import * as utils from './utils';

export default class Controller {
    constructor(renderControl, transformation) {
        this._renderControl = renderControl;
        this._transformation = transformation;
        this._kineticTranslate = null;
        this._scaleMin = 0.1;
        this._scaleMax = 10;
        this._clampRelativeBorder = 0.2;
        this._kindeticTranslateTimeConstant = 325;
    }

    _clampTranslateX(dx) {
        const renderer = this._renderControl.getRenderer(),
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
    }

    _clampTranslateY(dy) {
        const renderer = this._renderControl.getRenderer(),
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
    }

    translateAbsolute(dx, dy) {
        const t = this._transformation;

        t.setTranslateX(this._clampTranslateX(dx));
        t.setTranslateY(this._clampTranslateY(dy));

        this._renderControl.render();

        return this;
    }

    translateRelative(dx, dy) {
        const t = this._transformation;

        t.setTranslateX(this._clampTranslateX(t.getTranslateX() + dx));
        t.setTranslateY(this._clampTranslateY(t.getTranslateY() + dy));

        this._renderControl.render();

        return this;
    }

    kineticTranslate(velocityX, velocityY) {
        this.stopKineticTranslate();

        this._kineticTranslate = new KineticTranslate(
            this, velocityX, velocityY, this._kindeticTranslateTimeConstant
        );

        this._renderControl.getRenderer().addAnimation(this._kineticTranslate);

        return this;
    }

    stopKineticTranslate() {
        if (this._kineticTranslate) {
            this._kineticTranslate.cancel();
        }

        return this;
    }

    clampToScreen() {
        const t = this._transformation,
            dx = t.getTranslateX(),
            dy = t.getTranslateY(),
            cdx = this._clampTranslateX(dx),
            cdy = this._clampTranslateY(dy);

        if (dx === cdx && dy === cdy) {
            return;
        }

        this.translateAbsolute(cdx, cdy);

        return this;
    }

    getTranslateX() {
        return this._transformation.getTranslateX();
    }

    getTranslateY() {
        return this._transformation.getTranslateY();
    }

    rescale(scale) {
        this._transformation.setScale(utils.clamp(scale, this._scaleMin, this._scaleMax));

        this._renderControl.render();

        return this;
    }

    rescaleAroundCenter(scale, centerX, centerY) {
        scale = utils.clamp(scale, this._scaleMin, this._scaleMax);

        const t = this._transformation,
            oldScale = t.getScale(),
            fac = 1 - scale/oldScale;

        this
            .startBatch()
            .rescale(scale)
            .translateRelative(centerX * fac, centerY * fac)
            .commitBatch();

        return this;
    }

    startBatch() {
        this._renderControl.startBatch();
        return this;
    }

    commitBatch() {
        this._renderControl.commitBatch();
        return this;
    }

    getScale() {
        return this._transformation.getScale();
    }
}
