import TrackingCollection from './utils/TrackingCollection';
import Observable from './utils/Observable';

export default class FeatureSet<T> extends TrackingCollection<T> {
    constructor() {
        super();

        this.observable.pointerEnter = new Observable();
        this.observable.pointerLeave = new Observable();
        this.observable.click = new Observable();
    }

    _notifyPointerEnter(feature: T): void {
        if (this.contains(feature)) {
            this.observable.pointerEnter.fire(feature);
        }
    }

    _notifyPointerLeave(feature: T): void {
        if (this.contains(feature)) {
            this.observable.pointerLeave.fire(feature);
        }
    }

    _notifyClick(feature: T): void {
        if (this.contains(feature)) {
            this.observable.click.fire(feature);
        }
    }
}
