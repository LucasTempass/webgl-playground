export const vertexShaderContent = `#version 300 es
in vec3 position;
in vec3 base_color;

uniform mat4 model;

out vec4 color;

void main() {
    gl_Position = model * vec4(position, 1.0);
    color = vec4(base_color, 1.0);
}`;
