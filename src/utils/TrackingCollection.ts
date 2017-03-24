import Collection from './Collection';
import ListenerGroup from './ListenerGroup';
import {default as Observable, ObservableDelegate} from './Observable';

export default class TrackingCollection<T> extends Collection<T> {
    constructor() {
        super();

        this.observable.change = new Observable();
        this._listeners = new ListenerGroup();

        this.observable.add.addListener(this._onAddItem.bind(this));
        this.observable.remove.addListener(this._onRemoveItem.bind(this));
    }

    _onAddItem(item: ObservableDelegate) {
        this._listeners.add(item, 'change', this._onItemChange.bind(this));
    }

    _onRemoveItem(item: ObservableDelegate) {
        this._listeners.removeTarget(item);
    }

    _onItemChange(item: ObservableDelegate) {
        this._dependencyProvider.bump();
        this.observable.change.fire(item);
    }

    destroy() {
        if (this._items) {
            this._items.forEach((item) => {
                this._listeners.removeTarget(item);
            });
        }

        Collection.prototype.destroy.apply(this);
    }

    private _listeners: ListenerGroup;
}
