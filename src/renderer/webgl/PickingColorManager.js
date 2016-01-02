import DependencyProvider from '../../utils/DependencyProvider';
import RGBA from '../../RGBA';

export default class PickingColorManager {
    constructor(featureSetIndex) {
        this._featureSetIndex = featureSetIndex;
        this._dependecyProvider = new DependencyProvider(this);
    }

    setFeatureSetIndex(index) {
        this._featureSetIndex = index;
        this._dependecyProvider.bump();

        return this;
    }

    getColor(i) {
        return new RGBA(
            (((this._featureSetIndex + 1) & 0xFF00) >>> 8) / 255,
            (( this._featureSetIndex + 1) & 0x00FF) / 255,
            ((i & 0xFF00) >>> 8) / 255,
            ( i & 0x00FF) / 255
        );
    }
}
