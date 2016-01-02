import DependencyProvider from './utils/DependencyProvider';
import Observable from './utils/Observable';
import ListenerGroup from './utils/ListenerGroup';
import * as utils from './utils';

export default class FeatureSet {
    constructor() {
        this._features = [];
        this._listeners = new ListenerGroup();
        this._dependencyProvider = new DependencyProvider(this);
        this.observable = {
            add: new Observable(),
            remove: new Observable(),
            change: new Observable()
        };

        Observable.delegate(this, this.observable);
    }

    _onFeatureChange(feature) {
        this._dependencyProvider.bump();
        this.observable.change.fire(feature);
    }


    add(feature) {
        this._features.push(feature);
        this._listeners.add(feature, 'change', this._onFeatureChange.bind(this, feature));

        this._dependencyProvider.bump();
        this.observable.add.fire(feature);

        return this;
    }

    remove(feature) {
        const i = this._features.indexOf(feature);

        if (i >= 0) {
            this._features.splice(i, 1);
            this._listeners.removeTarget(feature);

            this._dependencyProvider.bump();
            this.observable.remove.fire(feature);
        }

        return this;
    }

    count() {
        return this._features.length;
    }

    forEach(cb, scope) {
        this._features.forEach(cb, scope);

        return this;
    }

    get(i) {
        return this._features[i];
    }

    destroy() {
        if (this._features) {
            this._features.forEach((feature) => {
                this._listeners.removeTarget(feature);
                utils.destroy(feature);
            });

            this._features = null;
        }
    }
}
