import DependencyProvider from '../../utils/DependencyProvider';
import * as mat4 from 'gl-matrix-mat4';

export default class ProjectionMatrix {
    constructor(width, height) {
        this._width = width;
        this._height = height;
        this._recalculationRequired = true;
        this._dependencyProvider = new DependencyProvider(this);
        this._matrix = mat4.create();
    }

    setWidth(width) {
        if (width === this._width) {
            return this;
        }

        this._width = width;
        this._recalculationRequired = true;
        this._dependencyProvider.bump();

        return this;
    }

    setHeight(height) {
        if (height === this._height) {
            return this;
        }

        this._height = height;
        this._recalculationRequired = true;
        this._dependencyProvider.bump();

        return this;
    }

    getMatrix() {
        if (this._recalculationRequired) {
            mat4.identity(this._matrix);

            mat4.ortho(this._matrix, -this._width/2, this._width/2,
                -this._height/2, this._height/2, 0, 1);

            this._recalculationRequired = false;
        }

        return this._matrix;
    }
}
