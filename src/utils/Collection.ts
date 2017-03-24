import {default as Observable, Listener, ObservableCollection, ObservableDelegate} from './Observable';
import DependencyProvider from './DependencyProvider';

export default class Collection<T> implements ObservableDelegate {

    constructor() {
        Observable.delegate(this, this.observable);
    }

    add(item: T): this {
        if (!this._itemSet.has(item)) {
            this._items.push(item);
            this._itemSet.add(item);
            this._dependencyProvider.bump();
            this.observable.add.fire(item);
        }

        return this;
    }

    remove(item: T): boolean {
        if (this._itemSet.has(item)) {
            this._items.splice(this._items.indexOf(item), 1);
            this._itemSet.delete(item);
            this._dependencyProvider.bump();
            this.observable.remove.fire(item);

            return true;
        }

        return false;
    }

    contains(item: T): boolean {
        return this._itemSet.has(item);
    }

    get(i: number): T {
        return this._items[i];
    }

    count(): number {
        return this._items.length;
    }

    forEach<U>(cb: (x: T) => void, scope?: U): this {
        this._items.forEach(cb, scope);

        return this;
    }

    find(predicate: (x: T) => boolean): T {
        const len = this._items.length;

        for (let i = 0; i < len; i++) {
            if (predicate(this._items[i])) {
                return this._items[i];
            }
        }
    }

    items(): Array<T> {
        return this._items;
    }

    destroy() {
        this._items = [];
    }

    addListener?: <U>(observable: string, listener: Listener<U>) => Listener<U>;
    removeListener?: <U>(observable: string, listener: Listener<U>) => void;

    observable: ObservableCollection = {
        add: new Observable(),
        remove: new Observable()
    };

    protected _items: Array<T> = [];
    protected _itemSet = new WeakSet<T>();
    protected _dependencyProvider = new DependencyProvider(this);
}
