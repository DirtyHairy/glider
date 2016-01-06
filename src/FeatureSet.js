import TrackingCollection from './utils/TrackingCollection';
import Observable from './utils/Observable';

export default class FeatureSet extends TrackingCollection {
    constructor(...args) {
        super(...args);

        this.observable.pointerEnter = new Observable();
        this.observable.pointerLeave = new Observable();
        this.observable.click = new Observable();
    }

    _notifyPointerEnter(feature) {
        if (this.contains(feature)) {
            this.observable.pointerEnter.fire(feature);
        }
    }

    _notifyPointerLeave(feature) {
        if (this.contains(feature)) {
            this.observable.pointerLeave.fire(feature);
        }
    }

    _notifyClick(feature) {
        if (this.contains(feature)) {
            this.observable.click.fire(feature);
        }
    }
}
