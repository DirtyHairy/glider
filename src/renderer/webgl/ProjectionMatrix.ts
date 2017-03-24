import DependencyProvider from '../../utils/DependencyProvider';
import mat4 = require('gl-matrix/src/gl-matrix/mat4');

export default class ProjectionMatrix {
    constructor(
        private _width: number,
        private _height: number
    ) {}

    setWidth(width: number): this {
        if (width === this._width) {
            return this;
        }

        this._width = width;
        this._recalculationRequired = true;
        this._dependencyProvider.bump();

        return this;
    }

    setHeight(height: number): this {
        if (height === this._height) {
            return this;
        }

        this._height = height;
        this._recalculationRequired = true;
        this._dependencyProvider.bump();

        return this;
    }

    getMatrix(): mat4 {
        if (this._recalculationRequired) {
            mat4.identity(this._matrix);

            mat4.ortho(this._matrix, -this._width / 2, this._width / 2,
                -this._height / 2, this._height / 2, 0, 1);

            this._recalculationRequired = false;
        }

        return this._matrix;
    }

    private _recalculationRequired = true;
    private _dependencyProvider = new DependencyProvider(this);
    private _matrix = mat4.create();
}
