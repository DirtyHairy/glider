import DependencyProvider from '../../utils/DependencyProvider';
import DependencyTracker from '../../utils/DependencyTracker';
import ListenerGroup from '../../utils/ListenerGroup';
import mat4 = require('gl-matrix/src/gl-matrix/mat4');

import Transformation from '../../Transformation';

export default class TransformationMatrix {

    constructor(private _transformation: Transformation) {
        this._listenerGroup.add(this._transformation, 'change', this._onTransformationChange.bind(this));
    }

    getMatrix(): mat4 {
        if (!this._dependencyTracker.isCurrent(this._transformation)) {
            const t = this._transformation,
                scale = t.getScale(),
                dx = t.getTranslateX(),
                dy = t.getTranslateY();

            mat4.identity(this._matrix);

            mat4.scale(this._matrix, this._matrix, [scale, scale, 1]);
            mat4.translate(this._matrix, this._matrix, [dx, dy, 0]);

            this._dependencyTracker.setCurrent(this._transformation);
        }

        return this._matrix;
    }

    destroy(): void {
        this._listenerGroup.removeTarget(this._transformation);
    }

    private _onTransformationChange(): void {
        this._dependencyProvider.bump();
    }

    private _dependencyProvider = new DependencyProvider(this);
    private _dependencyTracker = new DependencyTracker();
    private _matrix = mat4.create();
    private _listenerGroup = new ListenerGroup();
}
