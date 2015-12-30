export default class ListenerGroup {
    constructor() {
        this._map = new WeakMap();
    }

    add(target, event, listener) {
        let group;

        if (!this._map.has(target)) {
            group = {};

            this._map.set(target, group);
        } else {
            group = this._map.get(target);
        }

        group[event] = target.addListener(event, listener);

        return this;
    }

    remove(target, event) {
        if (!this._map.has(target)) {
            return this;
        }

        const group = this._map.get(target);

        if (group[event]) {
            target.removeListener(event, group[event]);
            delete group[event];

            if (Object.keys(group).length === 0) {
                this._map.delete(target);
            }
        }

        return this;
    }

    removeTarget(target) {
        if (!this._map.has(target)) {
            return this;
        }

        const group = this._map.get(target);

        Object.keys(group).forEach((event) => {
            target.removeListener(event, group[event]);
        });

        this._map.delete(target);

        return this;
    }
}
