#version 300 es

layout(location = 0) in vec4 aVertexPosition;
layout(location = 1) in vec2 aTexCoord;
layout(location = 2) in vec3 aNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform bool uFixedLighting;

out vec2 vTexCoord;
out vec3 vNormal;

void main() {
    vTexCoord = aTexCoord;
    if (uFixedLighting) {
        vNormal = normalize(aNormal);
    } else {
        vNormal = vec3(transpose(inverse(uModelViewMatrix)) * vec4(normalize(aNormal), 1.0));
    }
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}
