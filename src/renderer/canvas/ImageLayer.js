import * as utils from '../../utils';

export default class ImageLayer {
    constructor(ctx, imageUrl, transformation, canvasWidth, canvasHeight) {
        this._ctx = ctx;
        this._imageUrl = imageUrl;
        this._image = null;
        this._canvasWidth = canvasWidth;
        this._canvasHeight = canvasHeight;
        this._transformation = transformation;

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
        // We explicitly calculate the clipping rectangles instead of using a canvas transform
        // in order to reduce aliasing artifacts --- otherwise, the resulting fractional coordinates
        // would lead to a "glitter" effect during kinetic pan.
        const dx =          this._transformation.getTranslateX(),
            dy =            this._transformation.getTranslateY(),
            scale =         this._transformation.getScale(),
            imageWidth2 =   this._image.width / 2,
            imageHeight2 =  this._image.height / 2,
            canvasWidth2 =  this._canvasWidth / 2,
            canvasHeight2 = this._canvasHeight / 2,
            canvasLeft =    utils.clamp((-imageWidth2 + dx) * scale + canvasWidth2, 0, this._canvasWidth),
            canvasTop =     utils.clamp((-imageHeight2 - dy) * scale + canvasHeight2, 0, this._canvasHeight),
            canvasRight =   utils.clamp((imageWidth2 + dx) * scale + canvasWidth2, 0, this._canvasWidth),
            canvasBottom =  utils.clamp((imageHeight2 - dy) * scale + canvasHeight2, 0, this._canvasHeight),
            imageLeft =     utils.clamp(-canvasWidth2 / scale - dx + imageWidth2, 0, this._image.width),
            imageTop =      utils.clamp(-canvasHeight2 / scale + dy + imageHeight2, 0, this._image.height),
            imageRight =    utils.clamp(canvasWidth2 / scale - dx + imageWidth2, 0, this._image.width),
            imageBottom =   utils.clamp(canvasHeight2 / scale + dy + imageHeight2, 0, this._image.height);

        this._ctx.drawImage(
            this._image,
            Math.round(imageLeft),
            Math.round(imageTop),
            Math.round(imageRight - imageLeft),
            Math.round(imageBottom - imageTop),
            Math.round(canvasLeft),
            Math.round(canvasTop),
            Math.round(canvasRight - canvasLeft),
            Math.round(canvasBottom - canvasTop)
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
