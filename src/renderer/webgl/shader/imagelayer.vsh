attribute vec4 a_VertexPosition;
attribute vec2 a_TextureCoordinate;

varying vec2 v_TextureCoordinate;

uniform mat4 u_ProjectionMatrix, u_TransformationMatrix;

void main() {
    v_TextureCoordinate = a_TextureCoordinate;
    gl_Position = u_ProjectionMatrix * u_TransformationMatrix * a_VertexPosition;
}
