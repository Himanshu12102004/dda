#version 300 es
precision mediump float;
out vec4 color;
uniform vec3 userColors;
void main(){
  color=vec4(userColors,1.0);
}