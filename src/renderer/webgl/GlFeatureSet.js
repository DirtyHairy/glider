import DependencyTracker from '../../utils/DependencyTracker';
import Program from './glutil/Program';
import * as shader from './shader';
import * as utils from '../../utils';

export default class GlFeatureSet {
    constructor(gl, featureSet, projectionMatrix, transformationMatrix) {
        this._gl = gl;
        this._featureSet = featureSet;
        this._program = new Program(gl, shader.vsh.feature, shader.fsh.feature);

        this._dependencyTracker = new DependencyTracker();
        this._pickingDependencyTracker = new DependencyTracker();

        this._projectionMatrix = projectionMatrix;
        this._transformationMatrix = transformationMatrix;

        this._vertexPositions = null;
        this._vertexColors = null;
        this._pickingColors = null;
        this._vertexPositionBuffer = gl.createBuffer();
        this._vertexColorBuffer = gl.createBuffer();
        this._pickingColorBuffer = gl.createBuffer();
    }

    _updateProjectionMatrix() {
        this._dependencyTracker.update(this._projectionMatrix, () => {
            this._program.use((ctx) => {
                ctx.uniformMatrix4fv('u_ProjectionMatrix', this._projectionMatrix.getMatrix());
            });
        });
    }

    _updateTransformationMatrix() {
        this._dependencyTracker.update(this._transformationMatrix, () => {
            this._program.use((ctx) => {
                ctx.uniformMatrix4fv('u_TransformationMatrix', this._transformationMatrix.getMatrix());
            });
        });
    }

    _rebuildVertices() {
        const gl = this._gl;

        this._dependencyTracker.update(this._featureSet, () => {
            const featureCount = this._featureSet.count(),
                positionBufferLength = 12 * featureCount,
                colorBufferLength = 24 * featureCount;

            if (!this._vertexPositions || this._vertexPositions.length !== positionBufferLength) {
                this._vertexPositions = new Float32Array(positionBufferLength);
            }

            if (!this._vertexColors || this._vertexColors.length !== colorBufferLength) {
                this._vertexColors = new Float32Array(colorBufferLength);
            }

            this._featureSet.forEach(this._rebuildQuad, this);

            gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexPositionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this._vertexPositions, gl.DYNAMIC_DRAW);

            gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexColorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this._vertexColors, gl.DYNAMIC_DRAW);
        });
    }

    _rebuildQuad(quad, i) {
        const vertexBase = i * 12,
            colorBase = i * 24,
            bottom = quad.getBottom(),
            left = quad.getLeft(),
            top = bottom + quad.getHeight(),
            right = left + quad.getWidth(),
            fillColor = quad.getFillColor();

        const vertices = [
            left, bottom,       left, top,      right, top,
            right, top,         right, bottom,    left, bottom
        ];

        for (let j = 0; j < 12; j++) {
            this._vertexPositions[j + vertexBase] = vertices[j];
        }

        const color = [
            fillColor.r(), fillColor.g(), fillColor.b(), fillColor.alpha()
        ];

        for (let j = 0; j < 6; j++) {
            for (let k = 0; k < 4; k++) {
                this._vertexColors[colorBase + 4*j + k] = color[k];
            }
        }
    }

    _rebuildPickingVertices(pickingColorManager) {
        const gl = this._gl;

        this._rebuildVertices();

        this._pickingDependencyTracker.updateAll(
            [this._featureSet, pickingColorManager],
            () => {
                const featureCount = this._featureSet.count(),
                    colorBufferLength = 24 * featureCount;


                if (!this._pickingColors || this._pickingColors.length !== colorBufferLength) {
                    this._pickingColors = new Float32Array(colorBufferLength);
                }

                this._featureSet.forEach((quad, i) => {
                    this._rebuildPickingQuad(quad, i, pickingColorManager);
                });

                gl.bindBuffer(gl.ARRAY_BUFFER, this._pickingColorBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, this._pickingColors, gl.DYNAMIC_DRAW);
            }
        );
    }

    _rebuildPickingQuad(quad, i, pickingColorManager) {
        const colorBase = i * 24,
            pickingColor = pickingColorManager.getColor(i);

        const color = [
            pickingColor.r(), pickingColor.g(), pickingColor.b(), pickingColor.alpha()
        ];

        for (let j = 0; j < 6; j++) {
            for (let k = 0; k < 4; k++) {
                this._pickingColors[colorBase + 4*j + k] = color[k];
            }
        }
    }

    _rebindBuffers() {
        const gl = this._gl;

        this._program.use((ctx) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexPositionBuffer);
            ctx.enableVertexAttribArray('a_VertexPosition');
            ctx.vertexAttribPointer('a_VertexPosition', 2, gl.FLOAT);

            gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexColorBuffer);
            ctx.enableVertexAttribArray('a_VertexColor');
            ctx.vertexAttribPointer('a_VertexColor', 4, gl.FLOAT);
        });
    }

    _rebindPickingBuffers() {
        const gl = this._gl;

        this._program.use((ctx) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexPositionBuffer);
            ctx.enableVertexAttribArray('a_VertexPosition');
            ctx.vertexAttribPointer('a_VertexPosition', 2, gl.FLOAT);

            gl.bindBuffer(gl.ARRAY_BUFFER, this._pickingColorBuffer);
            ctx.enableVertexAttribArray('a_VertexColor');
            ctx.vertexAttribPointer('a_VertexColor', 4, gl.FLOAT);
        });
    }

    render() {
        const gl = this._gl;

        this._updateProjectionMatrix();
        this._updateTransformationMatrix();
        this._rebuildVertices();

        this._rebindBuffers();
        gl.drawArrays(gl.TRIANGLES, 0, this._featureSet.count() * 6);

        return this;
    }

    renderPicking(pickingColorManager) {
        const gl = this._gl;

        this._updateProjectionMatrix();
        this._updateTransformationMatrix();
        this._rebuildPickingVertices(pickingColorManager);

        this._rebindPickingBuffers();
        gl.drawArrays(gl.TRIANGLES, 0, this._featureSet.count() * 6);
    }

    destroy() {
        const gl = this._gl;

        this._program = utils.destroy(this._program);

        if (this._vertexPositionBuffer) {
            gl.deleteBuffer(this._vertexPositionBuffer);
            this._vertexPositionBuffer = null;
        }

        if (this._vertexColorBuffer) {
            gl.deleteBuffer(this._vertexColorBuffer);
            this._vertexPositionBuffer = null;
        }

        if (this._pickingColorBuffer) {
            gl.deleteBuffer(this._pickingColorBuffer);
            this._pickingColorBuffer = null;
        }
    }
}
