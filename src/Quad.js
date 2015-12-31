import DependencyProvider from './utils/DependencyProvider';
import Observable from './utils/Observable';

export default class Quad {
    constructor(
        /* jshint ignore: start */
        {
            left    = 0,
            bottom  = 0,
            width   = 0,
            height  = 0,
            fillColor = null,
        } = {}
        /* jshint ignore: end */
    ) {
        /* jshint ignore: start */
        this._left = left;
        this._bottom = bottom;
        this._width = width;
        this._height = height;
        this._fillColor = fillColor;
        /* jshint ignore: end */
        this.observable = {
            change: new Observable()
        };
        this._dependencyProvider = new DependencyProvider(this);

        Observable.delegate(this, this.observable);

    }

    _notifyChange() {
        this._dependencyProvider.bump();
        this.observable.change.fire();
    }

    setLeft(left) {
        this._left = left;
        this._notifyChange();

        return this;
    }

    getLeft() {
        return this._left;
    }

    setBottom(bottom) {
        this._bottom = bottom;
        this._notifyChange();

        return this;
    }

    getBottom() {
        return this._bottom;
    }

    setWidth(width) {
        this._width = width;
        this._notifyChange();

        return this;
    }

    getWidth() {
        return this._width;
    }

    setHeight(height) {
        this._height = height;
        this._notifyChange();

        return this;
    }

    getHeight() {
        return this._height;
    }

    setFillColor(color) {
        this._fillColor = color;
        this._notifyChange();

        return this;
    }

    getFillColor() {
        return this._fillColor;
    }
}
