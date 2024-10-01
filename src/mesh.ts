import { ObjModel } from "obj-file-parser";

export default class Mesh {
  vertices: Float32Array;
  indices: Uint32Array;

  constructor(model: ObjModel) {
    const serializedVertices: number[] = [];
    const serializedIndices: number[] = [];

    const faceVertices = model.faces.map((face) => face.vertices).flat();

    faceVertices.forEach((faceVertex, index) => {
      const positionIndex = faceVertex.vertexIndex - 1;

      const position = model.vertices[positionIndex];

      serializedVertices.push(position?.x || 0);
      serializedVertices.push(position?.y || 0);
      serializedVertices.push(position?.z || 0);
      serializedVertices.push(Math.random());
      serializedVertices.push(Math.random());
      serializedVertices.push(Math.random());

      serializedIndices.push(index);
    });

    this.vertices = Float32Array.from(serializedVertices);
    this.indices = Uint32Array.from(serializedIndices);
  }
}
