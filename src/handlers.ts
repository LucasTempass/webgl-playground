interface Point2D {
  x: number;
  y: number;
}

interface Point3D extends Point2D {
  z: number;
}

interface Transformations {
  rotation: Point3D;
  translation: Point3D;
  scale: number;
}

export function onKeyDown(
  event: KeyboardEvent,
  transformations: Transformations,
) {
  switch (event.key) {
    // Translação
    case "ArrowUp":
      transformations.translation.y += 0.1;
      break;
    case "ArrowDown":
      transformations.translation.y -= 0.1;
      break;
    case "ArrowLeft":
      transformations.translation.x -= 0.1;
      break;
    case "ArrowRight":
      transformations.translation.x += 0.1;
      break;
    // Rotação
    case "w":
      transformations.rotation.x += 0.1;
      break;
    case "s":
      transformations.rotation.x -= 0.1;
      break;
    case "a":
      transformations.rotation.y -= 0.1;
      break;
    case "d":
      transformations.rotation.y += 0.1;
      break;
    case "q":
      transformations.rotation.z += 0.1;
      break;
    case "e":
      transformations.rotation.z -= 0.1;
      break;
    // Escala
    case "+":
      transformations.scale += 0.1;
      break;
    case "-":
      transformations.scale -= 0.1;
      break;
  }
}
