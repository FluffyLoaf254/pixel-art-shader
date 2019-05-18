#version 300 es

precision mediump float;

uniform sampler2D sColorTexture;
uniform sampler2D sDepthTexture;
uniform float uCanvasWidth;
uniform float uCanvasHeight;

const float cZero = 0.0;
const float cOne = 1.0;
const float cDepthFactor = 1.05;
const float cNearFactor = 0.1;
const float cFarFactor = 100.0;
const vec4 cCelOutFactor = vec4(0.5, 0.5, 0.7, 1.0);

in vec2 vTexCoord;
out vec4 oFragColor;

float linearDepth(float depth)
{
    float ndcDepth = depth * 2.0 - cOne;
    return (2.0 * cNearFactor * cFarFactor) / (cFarFactor + cNearFactor - ndcDepth * (cFarFactor - cNearFactor));
}

void main() {
    float currentDepth = linearDepth(texture(sDepthTexture, vTexCoord).x);
    vec2 coordRight = vTexCoord + vec2(cOne / uCanvasWidth, cZero);
    vec2 coordLeft = vTexCoord - vec2(cOne / uCanvasWidth, cZero);
    vec2 coordUp = vTexCoord + vec2(cZero, cOne / uCanvasHeight);
    vec2 coordDown = vTexCoord - vec2(cZero, cOne / uCanvasHeight);
    if (currentDepth / linearDepth(texture(sDepthTexture, coordRight).x) > cDepthFactor) {
        oFragColor = texture(sColorTexture, coordRight) * cCelOutFactor;
    } else if (currentDepth / linearDepth(texture(sDepthTexture, coordLeft).x) > cDepthFactor) {
        oFragColor = texture(sColorTexture, coordLeft) * cCelOutFactor;
    } else if (currentDepth / linearDepth(texture(sDepthTexture, coordUp).x) > cDepthFactor) {
        oFragColor = texture(sColorTexture, coordUp) * cCelOutFactor;
    } else if (currentDepth / linearDepth(texture(sDepthTexture, coordDown).x) > cDepthFactor) {
        oFragColor = texture(sColorTexture, coordDown) * cCelOutFactor;
    } else {
        oFragColor = texture(sColorTexture, vTexCoord);
    }
}