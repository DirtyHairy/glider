import * as utils from '../../utils';
import ImageLayerInterface from '../ImageLayer';
import Transformation from '../../Transformation';

export default class ImageLayer implements ImageLayerInterface {
    constructor(
        private _ctx: CanvasRenderingContext2D,
        private _imageUrl: string,
        private _transformation: Transformation,
        private _canvas: HTMLCanvasElement
    ) {
        this._image = null;
        this._ready = this._init();
    }

    ready(): Promise<any> {
        return this._ready;
    }

    isReady(): boolean {
        return !!this._image;
    }

    render(): void {
        const dx = this._transformation.getTranslateX(),
            dy =            this._transformation.getTranslateY(),
            scale =         this._transformation.getScale(),
            dxDiscrete =    Math.round(dx * scale),
            dyDiscrete =    Math.round(dy * scale),
            imageWidth2 =   this._image.width / 2,
            imageHeight2 =  this._image.height / 2,
            canvasWidth2 =  this._canvas.width / 2,
            canvasHeight2 = this._canvas.height / 2,
            canvasLeft =    utils.clamp(
                Math.round(-imageWidth2 * scale + canvasWidth2) + dxDiscrete, 0, this._canvas.width),
            canvasTop =     utils.clamp(
                Math.round(-imageHeight2 * scale + canvasHeight2) - dyDiscrete, 0, this._canvas.height),
            canvasRight =   utils.clamp(
                Math.round(imageWidth2 * scale + canvasWidth2) + dxDiscrete, 0, this._canvas.width),
            canvasBottom =  utils.clamp(
                Math.round(imageHeight2 * scale + canvasHeight2) - dyDiscrete, 0, this._canvas.height),
            imageLeft =     utils.clamp(-canvasWidth2 / scale - dx + imageWidth2, 0, this._image.width),
            imageTop =      utils.clamp(-canvasHeight2 / scale + dy + imageHeight2, 0, this._image.height),
            imageRight =    utils.clamp(canvasWidth2 / scale - dx + imageWidth2, 0, this._image.width),
            imageBottom =   utils.clamp(canvasHeight2 / scale + dy + imageHeight2, 0, this._image.height);

        this._ctx.drawImage(
            this._image,
            imageLeft,
            imageTop,
            imageRight - imageLeft,
            imageBottom - imageTop,
            canvasLeft,
            canvasTop,
            canvasRight - canvasLeft,
            canvasBottom - canvasTop
        );
    }

    getImageWidth(): number {
        return this._image.width;
    }

    getImageHeight(): number {
        return this._image.height;
    }

    private _init(): Promise<any> {
        return utils.loadImage(this._imageUrl)
            .then((image) => this._image = image);
    }

    private _image: HTMLImageElement = null;
    private _ready: Promise<any> = null;

}
