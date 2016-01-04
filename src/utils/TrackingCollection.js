import Collection from './Collection';
import ListenerGroup from './ListenerGroup';
import Observable from './Observable';

export default class TrackingCollection extends Collection {
    constructor() {
        super();

        this.observable.change = new Observable();
        this._listeners = new ListenerGroup();

        this.observable.add.addListener(this._onAddItem.bind(this));
        this.observable.remove.addListener(this._onRemoveItem.bind(this));
    }

    _onAddItem(item) {
        this._listeners.add(item, 'change', this._onItemChange.bind(this));
    }

    _onRemoveItem(item) {
        this._listeners.removeTarget(item);
    }

    _onItemChange(item) {
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
}
