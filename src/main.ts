import "./style.css";
import { compileShader } from "./utils/compileShader";
import { fragmentShaderContent } from "./shaders/fragmentShader.ts";
import { vertexShaderContent } from "./shaders/vertexShader.ts";
import { getWebGLContext } from "./utils/webGlContext.ts";
import { mat4 } from "gl-matrix";
import { onKeyDown } from "./handlers.ts";
import { parseSimpleObjects } from "./objects/parser.ts";
import Mesh from "./mesh.ts";
import Camera from "./camera.ts";

const camera = new Camera();

async function getDefault() {
  const res = await fetch("assets/models/book.obj");
  return await res.text();
}

const meshName = document.getElementById("meshNameValue") as HTMLHeadingElement;

async function main() {
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

  gl.uniform1f(gl.getUniformLocation(shaderProgram, "ka"), 0.2);
  gl.uniform1f(gl.getUniformLocation(shaderProgram, "ks"), 0.5);
  gl.uniform1f(gl.getUniformLocation(shaderProgram, "kd"), 0.5);
  gl.uniform1f(gl.getUniformLocation(shaderProgram, "q"), 5.0);

  gl.uniform3f(
    gl.getUniformLocation(shaderProgram, "light_position"),
    0,
    10,
    100,
  );

  gl.uniform3f(
    gl.getUniformLocation(shaderProgram, "light_color"),
    1.0,
    1.0,
    1.0,
  );

  gl.enable(gl.DEPTH_TEST);

  let models = parseSimpleObjects(await getDefault());
  let meshes = models.map((m) => new Mesh(m));

  let transformations = meshes.map(() => ({
    rotation: { x: 0, y: 0, z: 0 },
    translation: { x: 0, y: 0, z: 0 },
    scale: 2,
  }));

  let selectedMeshIndex: number | null = null;

  let buffers = meshes.map((mesh) => {
    const vertexBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

    return { vertexBuffer, indexBuffer };
  });

  function render(_: number) {
    if (!shaderProgram) return;

    const glCanvas = gl.canvas;
    glCanvas.width = window.innerWidth;
    glCanvas.height = window.innerHeight;
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const viewMatrixLocation = gl.getUniformLocation(shaderProgram, "view");
    gl.uniformMatrix4fv(viewMatrixLocation, false, camera.viewMatrix);

    const projectionMatrixLocation = gl.getUniformLocation(
      shaderProgram,
      "projection",
    );

    gl.uniformMatrix4fv(
      projectionMatrixLocation,
      false,
      camera.projectionMatrix,
    );

    buffers.forEach((buffer, index) => {
      const mesh = meshes[index];

      const transformation = transformations[index];

      const model = mat4.create();

      mat4.translate(model, model, [
        transformation.translation.x,
        transformation.translation.y,
        transformation.translation.z,
      ]);

      mat4.rotateX(model, model, transformation.rotation.x);
      mat4.rotateY(model, model, transformation.rotation.y);
      mat4.rotateZ(model, model, transformation.rotation.z);

      mat4.scale(model, model, [
        transformation.scale,
        transformation.scale,
        transformation.scale,
      ]);

      gl.uniformMatrix4fv(uniformLocation, false, model);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vertexBuffer);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.indexBuffer);

      const positionAttributeLocation = gl.getAttribLocation(
        shaderProgram,
        "base_position",
      );
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.vertexAttribPointer(
        positionAttributeLocation,
        3,
        gl.FLOAT,
        false,
        9 * Float32Array.BYTES_PER_ELEMENT,
        0,
      );

      const colorAttributeLocation = gl.getAttribLocation(
        shaderProgram,
        "base_color",
      );
      gl.enableVertexAttribArray(colorAttributeLocation);
      gl.vertexAttribPointer(
        colorAttributeLocation,
        3,
        gl.FLOAT,
        false,
        9 * Float32Array.BYTES_PER_ELEMENT,
        3 * Float32Array.BYTES_PER_ELEMENT,
      );

      const normalAttributeLocation = gl.getAttribLocation(
        shaderProgram,
        "base_normal",
      );
      gl.enableVertexAttribArray(normalAttributeLocation);
      gl.vertexAttribPointer(
        normalAttributeLocation,
        3,
        gl.FLOAT,
        false,
        9 * Float32Array.BYTES_PER_ELEMENT,
        6 * Float32Array.BYTES_PER_ELEMENT,
      );

      gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_INT, 0);
    });

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

  window.addEventListener("keydown", (e) => {
    selectedMeshIndex = onKeyDown(
      e,
      transformations,
      selectedMeshIndex,
      camera,
    );

    const selected =
      selectedMeshIndex == null ? null : models[selectedMeshIndex];

    meshName.innerText = selected?.name ?? "Nenhum";
  });

  let isMouseDown = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  window.addEventListener("mousedown", (e) => {
    isMouseDown = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });

  window.addEventListener("mouseup", () => {
    isMouseDown = false;
  });

  window.addEventListener("mousemove", (e) => {
    if (!isMouseDown) return;

    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    camera.rotate(deltaY * 0.001, deltaX * 0.001);
  });

  const fileInput = document.getElementById("fileInput") as HTMLInputElement;

  const customFileButton = document.getElementById(
    "customFileButton",
  ) as HTMLButtonElement;

  customFileButton.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];

    if (!file) {
      return;
    }

    const text = await file.text();

    models = parseSimpleObjects(text);
    meshes = models.map((m) => new Mesh(m));

    transformations = meshes.map(() => ({
      rotation: { x: 0, y: 0, z: 0 },
      translation: { x: 0, y: 0, z: 0 },
      scale: 2,
    }));

    buffers = meshes.map((mesh) => {
      const vertexBuffer = gl.createBuffer();
      const indexBuffer = gl.createBuffer();

      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

      return { vertexBuffer, indexBuffer };
    });
  });
}

main();
