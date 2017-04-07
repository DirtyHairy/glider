import {Feature} from '../FeatureSet';

interface PickingManager {
    getFeatureAt(x: number, y: number): Feature;
    isExpensive(x: number, y: number): boolean;
}

export default PickingManager;
