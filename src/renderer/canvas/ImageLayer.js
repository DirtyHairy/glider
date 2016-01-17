import * as utils from '../../utils';

export default class ImageLayer {
    constructor(ctx, imageUrl, canvasWidth, canvasHeight) {
        this._ctx = ctx;
        this._imageUrl = imageUrl;
        this._image = null;
        this._canvasWidth = canvasWidth;
        this._canvasHeight = canvasHeight;

        this._ready = this._init();
    }

    _init() {
        return utils.loadImage(this._imageUrl)
            .then((image) => this._image = image);
    }

    ready() {
        return this._ready;
    }

    isReady() {
        return !!this._image;
    }

    render() {
        const ctx = this._ctx;

        ctx.drawImage(
            this._image,
            -this._image.width / 2,
            -this._image.height / 2
        );
    }

    getWidth() {
        return this._image.width;
    }

    getHeight() {
        return this._image.height;
    }

    updateCanvasSize(width, height) {
        this._canvasHeight = height;
        this._canvasWidth = width;
    }
}
