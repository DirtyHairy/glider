export default class FeatureInteractionProvider {
    constructor(featureSets, featurePicker) {
        this._featureSets = featureSets;
        this._featurePicker = featurePicker;
        this._currentMouseoverFeature = null;

        this._pointerX = 0;
        this._pointerY = 0;
        this._lastUpdate = 0;
        this._updateHandle = null;
        this._updateInterval = 50;
        this._initialized = false;
    }

    update(x, y) {
        const now = Date.now();

        if (typeof(x) !== 'undefined') {
            this._pointerX = x;
            this._pointerY = y;
            this._initialized = true;
        }

        if (!this._initialized || this._updateHandle !== null) {
            return this;
        }

        if ((now - this._lastUpdate) > this._updateInterval) {
            this._update();
        } else {
            this._updateHandle = setTimeout(
                () => {
                    this._update();
                    this._updateHandle = null;
                },
                this._updateInterval - now + this._lastUpdate
            );
        }

        return this;
    }

    _update() {
        const feature = this._featurePicker(this._pointerX, this._pointerY);

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

        this._lastUpdate = Date.now();
    }

    click(x, y) {
        const feature = this._featurePicker(x, y),
            featureSet = feature && this._featureSets.find((featureSet) => featureSet.contains(feature));

        if (featureSet) {
            featureSet._notifyClick(feature);
        }
    }
}
