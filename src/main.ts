import "./style.css";

function getWebGLContext(): WebGL2RenderingContext {
  const canvas = document.getElementById("canvas");

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Canvas not found");
  }

  const context = canvas?.getContext("webgl2");

  if (!context) {
    throw new Error("WebGL 2 not supported");
  }

  return context;
}

const vertexShaderSource = `#version 300 es
in vec3 position;
in vec3 color;
uniform mat4 model;
out vec4 finalColor;
void main() {
    gl_Position = model * vec4(position, 1.0);
    finalColor = vec4(color, 1.0);
}`;

// Fragment shader source code
const fragmentShaderSource = `#version 300 es
precision mediump float;
in vec4 finalColor;
out vec4 color;
void main() {
    color = finalColor;
}`;

const gl = getWebGLContext();

function compileShader(
  gl: WebGL2RenderingContext,
  source: string,
  type: number,
): WebGLProgram | null {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error("Error creating shader");
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Error compiling shader:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

const vertexShader: WebGLProgram | null = compileShader(
  gl,
  vertexShaderSource,
  gl.VERTEX_SHADER,
);

const fragmentShader: WebGLProgram | null = compileShader(
  gl,
  fragmentShaderSource,
  gl.FRAGMENT_SHADER,
);

if (!vertexShader || !fragmentShader) {
  throw new Error("Error compiling shaders");
}

const shaderProgram = gl.createProgram();

gl.attachShader(shaderProgram as WebGLProgram, vertexShader);
gl.attachShader(shaderProgram as WebGLProgram, fragmentShader);
gl.linkProgram(shaderProgram as WebGLProgram);

if (!gl.getProgramParameter(shaderProgram as WebGLProgram, gl.LINK_STATUS)) {
  console.error(
    "Error linking shader program:",
    gl.getProgramInfoLog(shaderProgram as WebGLProgram),
  );
}

// Use the shader program
gl.useProgram(shaderProgram);

let uniformLocation = gl.getUniformLocation(
  shaderProgram as WebGLProgram,
  "model",
);

// Set up vertex data buffer
const vao = setupGeometry(gl);

// Enable depth testing
gl.enable(gl.DEPTH_TEST);

function render(time: number) {
  // Clear color and depth buffers
  // gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.lineWidth(10);

  const model = new Float32Array([
    Math.cos(time * 0.001),
    0.0,
    -Math.sin(time * 0.001),
    0.0,
    0.0,
    1.0,
    0.0,
    0.0,
    Math.sin(time * 0.001),
    0.0,
    Math.cos(time * 0.001),
    0.0,
    0.0,
    0.0,
    0.0,
    1.0,
  ]);

  gl.uniformMatrix4fv(uniformLocation, false, model);

  // Draw the triangles
  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLES, 0, 18);

  gl.drawArrays(gl.POINTS, 0, 18);

  requestAnimationFrame(render);
}

// Start the rendering loop
requestAnimationFrame(render);

function setupGeometry(gl: WebGL2RenderingContext) {
  // Define the vertex data (positions and colors)
  const vertices = new Float32Array([
    // Base of the pyramid: 2 triangles
    // x    y    z    r    g    b
    -0.5, -0.5, -0.5, 1.0, 1.0, 0.0, -0.5, -0.5, 0.5, 0.0, 1.0, 1.0, 0.5, -0.5,
    -0.5, 1.0, 0.0, 1.0,

    -0.5, -0.5, 0.5, 1.0, 1.0, 0.0, 0.5, -0.5, 0.5, 0.0, 1.0, 1.0, 0.5, -0.5,
    -0.5, 1.0, 0.0, 1.0,

    // Sides of the pyramid
    -0.5, -0.5, -0.5, 1.0, 1.0, 0.0, 0.0, 0.5, 0.0, 1.0, 1.0, 0.0, 0.5, -0.5,
    -0.5, 1.0, 1.0, 0.0,

    -0.5, -0.5, -0.5, 1.0, 0.0, 1.0, 0.0, 0.5, 0.0, 1.0, 0.0, 1.0, -0.5, -0.5,
    0.5, 1.0, 0.0, 1.0,

    -0.5, -0.5, 0.5, 1.0, 1.0, 0.0, 0.0, 0.5, 0.0, 1.0, 1.0, 0.0, 0.5, -0.5,
    0.5, 1.0, 1.0, 0.0,

    0.5, -0.5, 0.5, 0.0, 1.0, 1.0, 0.0, 0.5, 0.0, 0.0, 1.0, 1.0, 0.5, -0.5,
    -0.5, 0.0, 1.0, 1.0,
  ]);

  // Create and bind the VAO
  const VAO = gl.createVertexArray();
  gl.bindVertexArray(VAO);

  // Create a buffer for the vertex data
  const VBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // Specify the layout of the vertex data
  // Position attribute (location = 0)
  gl.vertexAttribPointer(
    0,
    3,
    gl.FLOAT,
    false,
    6 * Float32Array.BYTES_PER_ELEMENT,
    0,
  );
  gl.enableVertexAttribArray(0);

  // Color attribute (location = 1)
  gl.vertexAttribPointer(
    1,
    3,
    gl.FLOAT,
    false,
    6 * Float32Array.BYTES_PER_ELEMENT,
    3 * Float32Array.BYTES_PER_ELEMENT,
  );

  gl.enableVertexAttribArray(1);

  // Unbind the VBO and VAO (good practice)
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindVertexArray(null);

  return VAO;
}
