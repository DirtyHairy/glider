import * as utils from './utils';
import RenderControl from './RenderControl';
import Transformation from './Transformation';

export default class Controller {
    constructor(
        private _renderControl: RenderControl,
        private _transformation: Transformation
    ) {}

    translateAbsolute(dx: number, dy: number): this {
        const t = this._transformation;

        t.setTranslateX(this._clampTranslateX(dx));
        t.setTranslateY(this._clampTranslateY(dy));

        this._renderControl.render();

        return this;
    }

    translateRelative(dx: number, dy: number): this {
        const t = this._transformation;

        t.setTranslateX(this._clampTranslateX(t.getTranslateX() + dx));
        t.setTranslateY(this._clampTranslateY(t.getTranslateY() + dy));

        this._renderControl.render();

        return this;
    }

    clampToScreen(): this {
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

    getTranslateX(): number {
        return this._transformation.getTranslateX();
    }

    getTranslateY(): number {
        return this._transformation.getTranslateY();
    }

    rescale(scale: number): this {
        this._transformation.setScale(utils.clamp(scale, this._scaleMin, this._scaleMax));

        this._renderControl.render();

        return this;
    }

    rescaleAroundCenter(scale: number, centerX: number, centerY: number): this {
        scale = utils.clamp(scale, this._scaleMin, this._scaleMax);

        const t = this._transformation,
            oldScale = t.getScale(),
            fac = 1 - scale / oldScale;

        this
            .startBatch()
            .rescale(scale)
            .translateRelative(centerX * fac, centerY * fac)
            .commitBatch();

        return this;
    }

    startBatch(): this {
        this._renderControl.startBatch();
        return this;
    }

    commitBatch(): this {
        this._renderControl.commitBatch();
        return this;
    }

    getScale(): number {
        return this._transformation.getScale();
    }

    private _clampTranslateX(dx: number): number {
        const renderer = this._renderControl.getRenderer(),
            canvas = renderer.getCanvas(),
            canvasWidth = canvas.width / 2,
            imageWidth = renderer.getImageWidth() / 2,
            scale = this._transformation.getScale(),
            border = canvasWidth * this._clampRelativeBorder;

        if (canvasWidth - (dx - imageWidth) * scale < border) {
            return (canvasWidth - border) / scale + imageWidth;
        }

        if ((dx + imageWidth) * scale + canvasWidth < border) {
            return (border - canvasWidth) / scale - imageWidth;
        }

        return dx;
    }

    private _clampTranslateY(dy: number): number {
        const renderer = this._renderControl.getRenderer(),
            canvas = renderer.getCanvas(),
            canvasHeight = canvas.height / 2,
            imageHeight = renderer.getImageHeight() / 2,
            scale = this._transformation.getScale(),
            border = canvasHeight * this._clampRelativeBorder;

        if (canvasHeight - (dy - imageHeight) * scale < border) {
            return (canvasHeight - border) / scale + imageHeight;
        }

        if ((dy + imageHeight) * scale + canvasHeight < border) {
            return (border - canvasHeight) / scale - imageHeight;
        }

        return dy;
    }

    private _scaleMin = 0.1;
    private _scaleMax = 10;
    private _clampRelativeBorder = 0.2;
}
