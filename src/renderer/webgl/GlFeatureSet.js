var utils = require('../../utils'),
    Program = require('./glutil/Program'),
    DependencyTracker = require('../../utils/DependencyTracker');

var fs = require('fs');

var featureSetVertexShadeSource = fs.readFileSync(__dirname + '/shader/feature.vsh').toString(),
    featureSetFragmentShaderSource = fs.readFileSync(__dirname + '/shader/feature.fsh').toString();

function GlFeatureSet(gl, featureSet, projectionMatrix, transformationMatrix) {
    this._gl = gl;
    this._featureSet = featureSet;
    this._program = new Program(gl, featureSetVertexShadeSource, featureSetFragmentShaderSource);

    this._vertexPositionBuffer = gl.createBuffer();
    this._vertexColorBuffer = gl.createBuffer();
    this._dependencyTracker = new DependencyTracker();

    this._projectionMatrix = projectionMatrix;
    this._transformationMatrix = transformationMatrix;
}

utils.extend(GlFeatureSet.prototype, {
    _dependencyTracker: null,
    _featureSet: null,
    _gl: null,
    _program: null,

    _projectionMatrix: null,
    _transformationMatrix: null,

    _vertexPositions: null,
    _vertexColors: null,

    _vertexPositionBuffer: null,
    _vertexColorBuffer: null,

    _updateProjectionMatrix: function() {
        var me = this;

        me._dependencyTracker.update(me._projectionMatrix, function() {
            me._program.use(function() {
                this.uniformMatrix4fv('u_ProjectionMatrix', me._projectionMatrix.getMatrix());
            });
        });
    },

    _updateTransformationMatrix: function() {
        var me = this;

        me._dependencyTracker.update(me._transformationMatrix, function() {
            me._program.use(function() {
                this.uniformMatrix4fv('u_TransformationMatrix', me._transformationMatrix.getMatrix());
            });
        });
    },

    _rebuildVertices: function() {
        var me = this,
            gl = me._gl;

        me._dependencyTracker.update(me._featureSet, function() {
            var featureCount = me._featureSet.count(),
                positionBufferLength = 12 * featureCount,
                colorBufferLength = 24 * featureCount;

            if (!me._vertexPositions || me._vertexPositions.length !== positionBufferLength) {
                me._vertexPositions = new Float32Array(positionBufferLength);
            }

            if (!me._vertexColors || me._vertexColors.length !== colorBufferLength) {
                me._vertexColors = new Float32Array(colorBufferLength);
            }

            me._featureSet.forEach(me._rebuildQuad, me);

            gl.bindBuffer(gl.ARRAY_BUFFER, me._vertexPositionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, me._vertexPositions, gl.DYNAMIC_DRAW);

            gl.bindBuffer(gl.ARRAY_BUFFER, me._vertexColorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, me._vertexColors, gl.DYNAMIC_DRAW);
        });
    },

    _rebuildQuad: function(quad, i) {
        var me = this,
            vertexBase = i * 12,
            colorBase = i * 24,
            bottom = quad.getBottom(),
            left = quad.getLeft(),
            top = bottom + quad.getHeight(),
            right = left + quad.getWidth(),
            fillColor = quad.getFillColor(),
            j, k;

        var vertices = [
            left, bottom,       left, top,      right, top,
            right, top,         right, bottom,    left, bottom
        ];

        for (j = 0; j < 12; j++) {
            me._vertexPositions[j + vertexBase] = vertices[j];
        }

        var color = [
            fillColor.r(), fillColor.g(), fillColor.b(), fillColor.alpha()
        ];

        for (j = 0; j < 6; j++) {
            for (k = 0; k < 4; k++) {
                me._vertexColors[colorBase + 4*j + k] = color[k];
            }
        }
    },

    _rebindBuffers: function() {
        var me = this,
            gl = me._gl;

        me._program.use(function() {
            gl.bindBuffer(gl.ARRAY_BUFFER, me._vertexPositionBuffer);
            this.enableVertexAttribArray('a_VertexPosition');
            this.vertexAttribPointer('a_VertexPosition', 2, gl.FLOAT);

            gl.bindBuffer(gl.ARRAY_BUFFER, me._vertexColorBuffer);
            this.enableVertexAttribArray('a_VertexColor');
            this.vertexAttribPointer('a_VertexColor', 4, gl.FLOAT);
        });
    },

    render: function() {
        var me = this,
            gl = me._gl;

        me._updateProjectionMatrix();
        me._updateTransformationMatrix();
        me._rebuildVertices();

        me._rebindBuffers();
        gl.drawArrays(gl.TRIANGLES, 0, me._featureSet.count() * 6);
    }
});

module.exports = GlFeatureSet;
