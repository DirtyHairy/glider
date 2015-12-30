import DependencyProvider from '../../utils/DependencyProvider';
import DependencyTracker from '../../utils/DependencyTracker';

var mat4 = require('gl-matrix-mat4'),
    utils = require('../../utils');

function TransformationMatrix(transformation) {
    this._transformation = transformation;
    this._dependencyProvider = new DependencyProvider(this);
    this._dependencyTracker = new DependencyTracker(this);
    this._matrix = mat4.create();

    this._handlers = [
        this._transformation.observable.change.addListener(this._onTransformationChange.bind(this))
    ];
}

utils.extend(TransformationMatrix.prototype, {
    _transformation: null,
    _dependencyProvider: null,
    _dependencyTracker: null,
    _handlers: null,

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

            mat4.identity(this._matrix);

            mat4.scale(this._matrix, this._matrix, [scale, scale, 1]);
            mat4.translate(this._matrix, this._matrix, [dx, dy, 0]);

            this._dependencyTracker.setCurrent(this._transformation);
        }

        return this._matrix;
    },

    destroy: function() {
        if (this._handlers) {
            this._handlers.forEach(function(handler) {
                utils.destroy(handler);
            });

            this._handlers = null;
        }
    }
});

module.exports = TransformationMatrix;
