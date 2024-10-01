import { ObjModel } from "obj-file-parser";

export default class Mesh {
  vertices: Float32Array;
  indices: Uint32Array;

  constructor(vertices: Float32Array, indices: Uint32Array) {
    this.vertices = vertices;
    this.indices = indices;
  }

  static fromObj(model: ObjModel): Mesh {
    const serializedVertices = [];
    let vertexCount = 0;
    const serializedIndices = [];

    for (const face of model.faces) {
      for (const faceVertex of face.vertices) {
        const positionIndex = faceVertex.vertexIndex - 1;

        const position = model.vertices[positionIndex];

        serializedVertices.push(position?.x || 0);
        serializedVertices.push(position?.y || 0);
        serializedVertices.push(position?.z || 0);

        serializedIndices.push(vertexCount);
        vertexCount++;
      }
    }

    const meshVertices = Float32Array.from(serializedVertices);
    const meshIndices = Uint32Array.from(serializedIndices);

    return new Mesh(meshVertices, meshIndices);
  }
}
