import DependencyProvider from './utils/DependencyProvider';
import {default as Observable, ObservableCollection} from './utils/Observable';

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

    setScale(scale: number): this {
        this._scale = scale;
        this._notifyChange();

        return this;
    }

    setTranslateX(dx: number): this {
        this._translateX = dx;
        this._notifyChange();

        return this;
    }

    setTranslateY(dy: number): this {
        this._translateY = dy;
        this._notifyChange();

        return this;
    }

    getScale(): number {
        return this._scale;
    }

    getTranslateX(): number {
        return this._translateX;
    }

    getTranslateY(): number {
        return this._translateY;
    }

    private _notifyChange(): void {
        this._dependencyProvider.bump();
        this.observable.change.fire();
    }

    public observable: ObservableCollection;

    private _dependencyProvider: DependencyProvider;
    private _scale: number;
    private _translateX: number;
    private _translateY: number;
}
