export const vertexShaderContent = `#version 300 es
in vec3 base_position;
in vec3 base_color;

uniform mat4 model;

out vec3 color;
out vec3 scaled_normal;
out vec3 position;

void main() {
    gl_Position = model * vec4(base_position, 1.0);
    color = base_color;
    // reduz para vec3 para facilitar cálculos no fragment shader
    scaled_normal = vec3(gl_Position);
    position = vec3(gl_Position);
}`;
