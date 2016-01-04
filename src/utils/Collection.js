import Observable from './Observable';
import DependencyProvider from './DependencyProvider';

export default class Collection {
    constructor() {
        this._items = [];
        this._itemSet = new WeakSet();
        this._dependencyProvider = new DependencyProvider(this);

        this.observable = {
            add: new Observable(),
            remove: new Observable()
        };

        Observable.delegate(this, this.observable);
    }

    add(item) {
        if (!this._itemSet.has(item)) {
            this._items.push(item);
            this._itemSet.add(item);
            this._dependencyProvider.bump();
            this.observable.add.fire(item);
        }

        return this;
    }

    remove(item) {
        if (this._itemSet.has(item)) {
            this._items.splice(this._items.indexOf(item), 1);
            this._itemSet.delete(item);
            this._dependencyProvider.bump();
            this.observable.remove.fire(item);

            return true;
        }

        return false;
    }

    contains(item) {
        return this._itemSet.has(item);
    }

    get(i) {
        return this._items[i];
    }

    count() {
        return this._items.length;
    }

    forEach(cb, scope) {
        this._items.forEach(cb, scope);

        return this;
    }

    destroy() {
        this._items = [];
    }
}
