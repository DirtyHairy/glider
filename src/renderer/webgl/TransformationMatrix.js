import DependencyProvider from '../../utils/DependencyProvider';
import DependencyTracker from '../../utils/DependencyTracker';
import * as mat4 from 'gl-matrix-mat4';
import * as utils from '../../utils';

export default class TransformationMatrix {
    constructor(transformation) {
        this._transformation = transformation;
        this._dependencyProvider = new DependencyProvider(this);
        this._dependencyTracker = new DependencyTracker(this);
        this._matrix = mat4.create();

        this._handlers = [
            this._transformation.observable.change.addListener(this._onTransformationChange.bind(this))
        ];
    }

    _onTransformationChange() {
        this._dependencyProvider.bump();
    }

    getMatrix() {
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

    destroy() {
        if (this._handlers) {
            this._handlers.forEach((handler) => {
                utils.destroy(handler);
            });

            this._handlers = null;
        }
    }

}
