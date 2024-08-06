#version 300 es
precision mediump float;
in vec2 vertex; 
uniform float pointSize;
void main() {
    gl_Position = vec4(vertex, 0.0, 1.0);
    gl_PointSize = pointSize; 
}
