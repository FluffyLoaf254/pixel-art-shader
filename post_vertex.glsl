#version 300 es

layout(location = 0) in vec4 aVertexPosition;
layout(location = 1) in vec2 aTexCoord;

out vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    gl_Position = aVertexPosition;
}