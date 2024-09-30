import "./style.css";
import { compileShader } from "./utils/compileShader";
import { fragmentShaderContent } from "./shaders/fragmentShader.ts";
import { vertexShaderContent } from "./shaders/vertexShader.ts";
import { getWebGLContext } from "./utils/webGlContext.ts";
import { mat4 } from "gl-matrix";
import { onKeyDown } from "./handlers.ts";
import { parseSimpleObject } from "./objects/parser.ts";
import { setupGeometry } from "./setupGeometry.ts";

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

const obj = parseSimpleObject().models[0];

const objectVertices = obj.vertices
  .map((vertex) => [vertex.x, vertex.y, vertex.z, 0, 1.0, 0])
  .flat();

const vertices = new Float32Array(objectVertices);

const vao = setupGeometry(gl, vertices);

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
  gl.drawArrays(gl.TRIANGLES, 0, obj.vertices.length);

  requestAnimationFrame(render);
}

// inicia o loop de renderização
requestAnimationFrame(render);

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
