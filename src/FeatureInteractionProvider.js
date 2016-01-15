import Throttle from './utils/Throttle';

export default class FeatureInteractionProvider {
    constructor(featureSets, pickingProvider) {
        this._featureSets = featureSets;
        this._pickingProvider = pickingProvider;
        this._currentMouseoverFeature = null;

        this._pointerX = 0;
        this._pointerY = 0;
        this._initialized = false;

        this._longInterval = 50;
        this._shortInterval = 10;

        this._throttledUpdate = new Throttle(this._update.bind(this), this._longInterval);
    }

    update(x, y) {
        if (typeof(x) !== 'undefined') {
            this._pointerX = x;
            this._pointerY = y;
            this._initialized = true;
        }

        this._throttledUpdate.setInterval(
            this._pickingProvider.isExpensive(this._pointerX, this._pointerY) ?
                this._longInterval : this._shortInterval
        );
        this._throttledUpdate.call(this._pointerX, this._pointerY);

        return this;
    }

    _update(x, y) {
        const feature = this._pickingProvider.getFeatureAt(x, y);

        if (this._currentMouseoverFeature !== feature) {
            const newFeatureSet = feature && this._featureSets.find(
                    (featureSet) => featureSet.contains(feature)),
                oldFeatureSet = this._currentMouseoverFeature && this._featureSets.find(
                    (featureSet) => featureSet.contains(this._currentMouseoverFeature));

            if (oldFeatureSet) {
                oldFeatureSet._notifyPointerLeave(this._currentMouseoverFeature);
            }
            if (newFeatureSet) {
                newFeatureSet._notifyPointerEnter(feature);
            }

            this._currentMouseoverFeature = feature;
        }
    }

    click(x, y) {
        const feature = this._pickingProvider.getFeatureAt(x, y),
            featureSet = feature && this._featureSets.find((featureSet) => featureSet.contains(feature));

        if (featureSet) {
            featureSet._notifyClick(feature);
        }
    }
}
