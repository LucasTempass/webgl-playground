import "./style.css";

import * as twgl from "twgl.js";

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

const gl = getWebGLContext();

const programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

const arrays = {
  position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
};

const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

function render(time: number) {
  twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  const uniforms = {
    time: time * 0.001,
    resolution: [gl.canvas.width, gl.canvas.height],
  };

  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
  twgl.setUniforms(programInfo, uniforms);
  twgl.drawBufferInfo(gl, bufferInfo);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
