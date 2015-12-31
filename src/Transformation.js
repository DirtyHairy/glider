import DependencyProvider from './utils/DependencyProvider';
import Observable from './utils/Observable';

export default class Transformation {
    constructor() {
        this._dependencyProvider = new DependencyProvider(this);
        this._scale = 1;
        this._translateX = 0;
        this._translateY = 0;

        this.observable = {
            change: new Observable()
        };

        Observable.delegate(this, this.observable);
    }

    _notifyChange() {
        this._dependencyProvider.bump();
        this.observable.change.fire();
    }

    setScale(scale) {
        this._scale = scale;
        this._notifyChange();

        return this;
    }

    setTranslateX(dx) {
        this._translateX = dx;
        this._notifyChange();

        return this;
    }

    setTranslateY(dy) {
        this._translateY = dy;
        this._notifyChange();

        return this;
    }

    getScale() {
        return this._scale;
    }

    getTranslateX() {
        return this._translateX;
    }

    getTranslateY() {
        return this._translateY;
    }
}
