import type { BufferAttribute, Object3D } from "three";
import type { FtoTeachingFace, PuzzleId } from "./puzzleIds";
import type { ThreeModule } from "./threeTypes";

export function puzzleBaseRoll(puzzle: PuzzleId) { return puzzle === "fto" ? Math.PI / 2 : 0; }

export function puzzlePreviewBaseRoll(puzzle: PuzzleId, focusFtoWhiteFace = false) {
  return puzzle === "fto" && focusFtoWhiteFace ? 0 : puzzleBaseRoll(puzzle);
}

export function puzzleDefaultYaw(puzzle: PuzzleId) { return puzzle === "fto" ? 0.55 : -0.55; }

export function puzzleInitialOrbit(puzzle: PuzzleId, focusFtoWhiteFace = false) {
  if (puzzle === "fto" && focusFtoWhiteFace) return { yaw: 0, pitch: 0 };
  return { yaw: puzzleDefaultYaw(puzzle), pitch: 0.32 };
}

export function puzzlePreviewDistance(puzzle: PuzzleId, defaultDistance: number, focusFtoWhiteFace = false) {
  return puzzle === "fto" && focusFtoWhiteFace ? 3.9 : defaultDistance;
}

export function puzzlePreviewSetupAlgorithm(puzzle: PuzzleId, scramble: string, focusFtoWhiteFace = false) {
  return scramble;
}

type FtoStickerMesh = Object3D & {
  isMesh?: boolean;
  geometry?: { attributes?: { position?: BufferAttribute; color?: BufferAttribute } };
};

export function focusActualFtoFace(THREE: ThreeModule, puzzleObject: Object3D, puzzleBase: Object3D, target: FtoTeachingFace) {
  const normalCounts = new Map<string, { normal: InstanceType<ThreeModule["Vector3"]>; count: number }>();
  puzzleObject.updateWorldMatrix(true, true);
  puzzleObject.traverse((child) => {
    const mesh = child as FtoStickerMesh;
    const position = mesh.geometry?.attributes?.position;
    const color = mesh.geometry?.attributes?.color;
    if (!mesh.isMesh || !position || !color) return;
    for (let vertex = 0; vertex + 2 < position.count; vertex += 3) {
      const average = [0, 1, 2].map((offset) => new THREE.Color(color.getX(vertex + offset), color.getY(vertex + offset), color.getZ(vertex + offset)).convertLinearToSRGB());
      const isTarget = target === "white"
        ? average.every((value) => value.r > 0.97 && value.g > 0.97 && value.b > 0.97)
        : average.every((value, index) => index === 0 ? value.r > 0.97 : index === 1 ? value.g > 0.2 && value.g < 0.9 : value.b < 0.2);
      if (!isTarget) continue;
      const a = new THREE.Vector3(position.getX(vertex), position.getY(vertex), position.getZ(vertex)).applyMatrix4(mesh.matrixWorld);
      const b = new THREE.Vector3(position.getX(vertex + 1), position.getY(vertex + 1), position.getZ(vertex + 1)).applyMatrix4(mesh.matrixWorld);
      const c = new THREE.Vector3(position.getX(vertex + 2), position.getY(vertex + 2), position.getZ(vertex + 2)).applyMatrix4(mesh.matrixWorld);
      const normal = b.sub(a).cross(c.sub(a)).normalize();
      const center = a.add(b).add(c).multiplyScalar(1 / 3);
      if (normal.dot(center) < 0) normal.negate();
      const key = normal.toArray().map((value) => value.toFixed(2)).join(",");
      const known = normalCounts.get(key);
      if (known) known.count += 1;
      else normalCounts.set(key, { normal, count: 1 });
    }
  });
  const targetFace = Array.from(normalCounts.values()).sort((first, second) => second.count - first.count)[0];
  if (targetFace) puzzleBase.quaternion.setFromUnitVectors(targetFace.normal, new THREE.Vector3(-0.62, 0, 0.78).normalize());
}
