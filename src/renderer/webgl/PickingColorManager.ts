import DependencyProvider from '../../utils/DependencyProvider';
import RGBA from '../../RGBA';

class PickingColorManager {
    constructor(private _featureSetIndex: number) {
        this._dependencyProvider = new DependencyProvider(this);
    }

    setFeatureSetIndex(index: number) {
        this._featureSetIndex = index;
        this._dependencyProvider.bump();

        return this;
    }

    /* tslint:disable:no-bitwise */
    getColor(i: number): RGBA {
        return new RGBA(
            (((this._featureSetIndex + 1) & 0xFF00) >>> 8) / 255,
            (( this._featureSetIndex + 1) & 0x00FF) / 255,
            ((i & 0xFF00) >>> 8) / 255,
            ( i & 0x00FF) / 255
        );
    }

    private _dependencyProvider: DependencyProvider;
}

export default PickingColorManager;
