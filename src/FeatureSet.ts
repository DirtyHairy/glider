import TrackingCollection from './utils/TrackingCollection';
import Observable from './utils/Observable';

export interface Feature {
}

export default class FeatureSet extends TrackingCollection<Feature> {
    constructor() {
        super();

        this.observable.pointerEnter = new Observable();
        this.observable.pointerLeave = new Observable();
        this.observable.click = new Observable();
    }

    _notifyPointerEnter(feature: Feature): void {
        if (this.contains(feature)) {
            this.observable.pointerEnter.fire(feature);
        }
    }

    _notifyPointerLeave(feature: Feature): void {
        if (this.contains(feature)) {
            this.observable.pointerLeave.fire(feature);
        }
    }

    _notifyClick(feature: Feature) {
        if (this.contains(feature)) {
            this.observable.click.fire(feature);
        }
    }
}
