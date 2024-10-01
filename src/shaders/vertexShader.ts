export const vertexShaderContent = `#version 300 es
in vec3 position;

uniform mat4 model;

out vec4 color;

void main() {
    gl_Position = model * vec4(position, 1.0);
    color = vec4(1.0, 0.0, 0.0, 1.0);
}`;
