export interface Listener<T> {
    (payload?: T): void;
}

export interface ObservableDelegate {
    addListener?: <T>(observable: string, listener: Listener<T>) => void;
    removeListener?: <T>(observable: string, listener: Listener<T>) => void;
}

export interface ObservableCollection {
    [key: string]: Observable<any>;
}

class Observable<T> {

    static delegate(instance: ObservableDelegate, collection: ObservableCollection) {
        instance.addListener = <T>(observable: string, listener: Listener<T>) => {
            if (!collection[observable]) {
                throw new Error('no observable' + observable);
            }

            collection[observable].addListener(listener);
        };

        instance.removeListener = <T>(observable: string, listener: Listener<T>) => {
            if (!collection[observable]) {
                throw new Error('no observable ' + observable);
            }

            collection[observable].removeListener(listener);
        };
    }

    addListener(listener: Listener<T>): Listener<T> {
        this._listeners.push(listener);

        return listener;
    }

    removeListener(listener: Listener<T>): this {
        const i = this._listeners.indexOf(listener);

        if (i >= 0) {
            this._listeners.splice(i, 1);
        }

        return this;
    }

    fire(payload?: T): this {
        const len = this._listeners.length;

        for (let i = 0; i < len; i++) {
            this._listeners[i](payload);
        }

        return this;
    }

    private _listeners: Array<Listener<T>> = [];
}

export default Observable;
