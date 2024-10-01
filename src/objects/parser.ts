import OBJFile, { ObjModel } from "obj-file-parser";

export async function parseSimpleObject(path: string): Promise<ObjModel> {
  const res = await fetch(path);
  const file = await res.text();
  return new OBJFile(file).parse().models[0];
}
