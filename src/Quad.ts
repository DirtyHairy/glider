import DependencyProvider from './utils/DependencyProvider';
import Observable from './utils/Observable';
import {Feature} from './FeatureSet';
import RGBA from './RGBA';

export default class Quad implements Feature {

    constructor(
        {
            left    = 0,
            bottom  = 0,
            width   = 0,
            height  = 0,
            fillColor = null,
        }: {
            left: number,
            bottom: number,
            width: number,
            height: number,
            fillColor: RGBA
        }
    ) {
        this._left = left;
        this._bottom = bottom;
        this._width = width;
        this._height = height;
        this._fillColor = fillColor;

        Observable.delegate(this, this.observable);

    }

    setLeft(left: number): this {
        this._left = left;
        this._notifyChange();

        return this;
    }

    getLeft(): number {
        return this._left;
    }

    setBottom(bottom: number): this {
        this._bottom = bottom;
        this._notifyChange();

        return this;
    }

    getBottom(): number {
        return this._bottom;
    }

    setWidth(width: number): this {
        this._width = width;
        this._notifyChange();

        return this;
    }

    getWidth(): number {
        return this._width;
    }

    setHeight(height: number): this {
        this._height = height;
        this._notifyChange();

        return this;
    }

    getHeight(): number {
        return this._height;
    }

    setFillColor(color: RGBA): this {
        this._fillColor = color;
        this._notifyChange();

        return this;
    }

    getFillColor(): RGBA {
        return this._fillColor;
    }

    private _notifyChange(): void {
        this._dependencyProvider.bump();
        this.observable.change.fire();
    }

    observable = {
        change: new Observable()
    };

    private _left: number;
    private _bottom: number;
    private _width: number;
    private _height: number;
    private _fillColor: RGBA;

    private _dependencyProvider = new DependencyProvider(this);
}
