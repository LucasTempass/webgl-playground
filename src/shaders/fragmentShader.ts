export const fragmentShaderContent = `#version 300 es
precision mediump float;
in vec4 finalColor;
out vec4 color;
void main() {
    color = finalColor;
}`;
