attribute vec4 a_VertexPosition;
attribute vec4 a_VertexColor;

varying vec4 v_Color;

uniform mat4 u_ProjectionMatrix, u_TransformationMatrix;

void main() {
    v_Color = a_VertexColor;
    gl_Position = u_ProjectionMatrix * u_TransformationMatrix * a_VertexPosition;
}
