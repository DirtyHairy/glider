import {Feature} from '../FeatureSet';

interface PickingManager {
    getFeatureAt(x: number, y: number): Feature;
    isExpensive(): boolean;
}

export default PickingManager;
