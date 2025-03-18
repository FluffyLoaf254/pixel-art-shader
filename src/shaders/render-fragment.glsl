#version 300 es

precision mediump float;

uniform sampler2D sTexture;
uniform vec3 uLightDirection;
uniform float uSmoothFactor;

const float cZero = 0.0;
const float cOne = 1.0;
const vec3 cDefaultLightFactor = vec3(0.85);

in vec2 vTexCoord;
in vec3 vNormal;

out vec4 oFragColor;

void main() {
    float nDotL = max(dot(normalize(uLightDirection), vNormal), cZero);
    vec3 lightFactor = cDefaultLightFactor;
    if (nDotL > uSmoothFactor) {
        lightFactor = vec3(cOne, cOne, 0.85);
    } else if (nDotL < uSmoothFactor / 3.0) {
        lightFactor = vec3(0.6, 0.5, 0.8);
    }
    oFragColor = vec4(texture(sTexture, vTexCoord).rgb * lightFactor, cOne);
}
