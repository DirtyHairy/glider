var glmatrix = require('gl-matrix'),
    utils = require('../../utils'),
    DependencyProvider = require('../../utils/DependencyProvider'),
    DependencyTracker = require('../../utils/DependencyTracker');

function TransformationMatrix(transformation) {
    this._transformation = transformation;
    this._dependencyProvider = new DependencyProvider(this);
    this._dependencyTracker = new DependencyTracker(this);

    this._transformation.observable.change.addListener(this._onTransformationChange.bind(this));
}

utils.extend(TransformationMatrix.prototype, {
    _transformation: null,
    _dependencyProvider: null,
    _dependencyTracker: null,

    _matrix: null,

    _onTransformationChange: function() {
        this._dependencyProvider.bump();
    },

    getMatrix: function() {
        if (!this._dependencyTracker.isCurrent(this._transformation)) {
            var t = this._transformation,
                scale = t.getScale(),
                dx = t.getTranslateX(),
                dy = -t.getTranslateY();

            this._matrix = glmatrix.mat4.create();

            glmatrix.mat4.scale(this._matrix, this._matrix, [scale, scale, 1]);
            glmatrix.mat4.translate(this._matrix, this._matrix, [dx, dy, 0]);

            this._dependencyTracker.setCurrent(this._transformation);
        }

        return this._matrix;
    }
});

module.exports = TransformationMatrix;