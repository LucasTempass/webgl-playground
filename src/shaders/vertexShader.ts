export const vertexShaderContent = `#version 300 es
in vec3 position;
in vec3 color;
uniform mat4 model;
out vec4 finalColor;
void main() {
    gl_Position = model * vec4(position, 1.0);
    finalColor = vec4(color, 1.0);
}`;
