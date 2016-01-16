import Observable from '../../utils/Observable';

export default class Renderer {
    constructor(canvas, imageUrl, transformation, featureSets) {
        this._canvas = canvas;
        this._imageUrl = imageUrl;
        this._transformation = transformation;
        this._featureSets = featureSets;

        this.observable = {
            render: new Observable()
        };
        Observable.delegate(this, this.observable);
    }

    render() {
        return this;
    }

    getCanvas() {
        return this._canvas;
    }

    applyCanvasResize() {
        return this;
    }

    addAnimation(animation) {
        return this;
    }

    removeAnimation(animation) {
        return this;
    }

    ready() {
        return new Promise((resolve) => resolve());
    }

    getPickingProvider() {
        return {
            getFeatureAt: () => null,
            isExpensive: () => false
        };
    }

    getImageWidth() {
        return 0;
    }

    getImageHeight() {
        return 0;
    }

    destroy() {}
}
