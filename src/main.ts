import "./style.css";
import { compileShader } from "./utils/compileShader";
import { fragmentShaderContent } from "./shaders/fragmentShader.ts";
import { vertexShaderContent } from "./shaders/vertexShader.ts";
import { getWebGLContext } from "./utils/webGlContext.ts";
import { mat4 } from "gl-matrix";
import { onKeyDown } from "./handlers.ts";
import { parseSimpleObjects } from "./objects/parser.ts";
import Mesh from "./mesh.ts";

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
    0,
    -50,
  );
  gl.uniform3f(
    gl.getUniformLocation(shaderProgram, "light_color"),
    1.0,
    1.0,
    1.0,
  );

  gl.enable(gl.DEPTH_TEST);

  const transformations = {
    rotation: { x: 0, y: 0, z: 0 },
    translation: { x: 0, y: 0, z: 0 },
    scale: 2,
  };

  let isDragging = false;
  let lastMousePosition = { x: 0, y: 0 };

  const models = await parseSimpleObjects("assets/models/book.obj");
  const meshes = models.map((model) => new Mesh(model));

  const buffers = meshes.map((mesh) => {
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

    buffers.forEach((buffer, index) => {
      const mesh = meshes[index];

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
}

main();
