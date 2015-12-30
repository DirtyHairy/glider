import DependencyProvider from '../../utils/DependencyProvider';

var mat4 = require('gl-matrix-mat4'),
    utils = require('../../utils');

function ProjectionMatrix(width, height) {
    this._width = width;
    this._height = height;
    this._recalculationRequired = true;
    this._dependencyProvider = new DependencyProvider(this);
    this._matrix = mat4.create();
}

utils.extend(ProjectionMatrix.prototype, {
    _width: 0,
    _height: 0,

    _matrix: null,
    _recalculationRequired: true,
    _dependencyProvider: null,

    setWidth: function(width) {
        if (width === this._width) {
            return this;
        }

        this._width = width;
        this._recalculationRequired = true;
        this._dependencyProvider.bump();

        return this;
    },

    setHeight: function(height) {
        if (height === this._height) {
            return this;
        }

        this._height = height;
        this._recalculationRequired = true;
        this._dependencyProvider.bump();

        return this;
    },

    getMatrix: function() {
        if (this._recalculationRequired) {
            mat4.identity(this._matrix);

            mat4.ortho(this._matrix, -this._width/2, this._width/2,
                -this._height/2, this._height/2, 0, 1);

            this._recalculationRequired = false;
        }

        return this._matrix;
    }
});

module.exports = ProjectionMatrix;
