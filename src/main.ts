import "./style.css";
import { compileShader } from "./utils/compileShader";
import { VertexAttribute } from "./utils/attributes.ts";
import { fragmentShaderContent } from "./shaders/fragmentShader.ts";
import { vertexShaderContent } from "./shaders/vertexShader.ts";
import { getWebGLContext } from "./utils/webGlContext.ts";
import { mat4 } from "gl-matrix";
import { onKeyDown } from "./handlers.ts";

const gl = getWebGLContext();

const vertexShader = compileShader(gl, vertexShaderContent, gl.VERTEX_SHADER);

const fragmentShader = compileShader(
  gl,
  fragmentShaderContent,
  gl.FRAGMENT_SHADER,
);

const shaderProgram = gl.createProgram();

if (!shaderProgram) {
  throw new Error("Error creating shader program");
}

gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);

if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
  console.error(
    "Error linking shader program:",
    gl.getProgramInfoLog(shaderProgram),
  );
}

gl.useProgram(shaderProgram);

const uniformLocation = gl.getUniformLocation(shaderProgram, "model");

const vao = setupGeometry(gl);

gl.enable(gl.DEPTH_TEST);

// Variáveis para controle de transformações
const transformations = {
  rotation: { x: 0, y: 0, z: 0 },
  translation: { x: 0, y: 0, z: 0 },
  scale: 1,
};

// Controle de mouse
let isDragging = false;
let lastMousePosition = { x: 0, y: 0 };

function render(_: number) {
  // limpa buffers de cor e profundidade
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const model = mat4.create();

  mat4.translate(model, model, [
    transformations.translation.x,
    transformations.translation.y,
    transformations.translation.z,
  ]);

  mat4.rotateX(model, model, transformations.rotation.x);
  mat4.rotateY(model, model, transformations.rotation.y);
  mat4.rotateZ(model, model, transformations.rotation.z);

  mat4.scale(model, model, [
    transformations.scale,
    transformations.scale,
    transformations.scale,
  ]);

  gl.uniformMatrix4fv(uniformLocation, false, model);

  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLES, 0, 18);

  gl.drawArrays(gl.POINTS, 0, 18);

  requestAnimationFrame(render);
}

// inicia o loop de renderização
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

  gl.vertexAttribPointer(
    VertexAttribute.POSITION,
    3,
    gl.FLOAT,
    false,
    6 * Float32Array.BYTES_PER_ELEMENT,
    0,
  );
  gl.enableVertexAttribArray(0);

  gl.vertexAttribPointer(
    VertexAttribute.COLOR,
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

window.addEventListener("mousedown", (event) => {
  isDragging = true;
  lastMousePosition = { x: event.clientX, y: event.clientY };
});

window.addEventListener("mouseup", () => {
  isDragging = false;
});

window.addEventListener("mousemove", (event) => {
  if (!isDragging) {
    return;
  }
  const deltaX = event.clientX - lastMousePosition.x;
  const deltaY = event.clientY - lastMousePosition.y;
  transformations.rotation.y += deltaX * 0.01;
  transformations.rotation.x += deltaY * 0.01;
  lastMousePosition = { x: event.clientX, y: event.clientY };
});

window.addEventListener("keydown", (e) => onKeyDown(e, transformations));
