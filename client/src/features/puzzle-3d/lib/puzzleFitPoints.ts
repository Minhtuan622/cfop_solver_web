/**
 * Lấy các điểm đỉnh đang hiện của mô hình Three.js (đã nhân ma trận thế giới)
 * để căn khoảng cách camera. Chỉ dùng kiểu của Three.js (không import runtime).
 */
import type { BufferAttribute, Object3D, Vector3 } from "three";
import type { ProjectedPoint } from "./puzzleCamera";

type MaterialLike = { visible?: boolean; opacity?: number };

type FitMesh = Object3D & {
  isMesh?: boolean;
  geometry?: {
    attributes?: { position?: BufferAttribute };
    groups?: ReadonlyArray<{
      start: number;
      count: number;
      materialIndex?: number;
    }>;
    index?: BufferAttribute | null;
  };
  material?: MaterialLike | MaterialLike[];
};

/**
 * cubing.js hides hint facelets behind invisible materials and meshes.
 * Both extend past the puzzle, so only sample groups the renderer shows.
 */
function isShownMaterial(material: MaterialLike | undefined) {
  if (!material) return false;
  return material.visible !== false && (material.opacity ?? 1) > 0.02;
}

function isShown(object: Object3D) {
  let node: Object3D | null = object;
  while (node) {
    if (!node.visible) return false;
    node = node.parent;
  }
  return true;
}

/**
 * Các điểm đỉnh đang hiện của `puzzleObject`. `vertex` là một `Vector3` dùng
 * làm bộ đệm (do nơi gọi tạo từ module `three` đã nạp động).
 */
export function collectShownPoints(
  puzzleObject: Object3D,
  vertex: Vector3
): ProjectedPoint[] {
  const points: ProjectedPoint[] = [];
  puzzleObject.traverse(child => {
    const mesh = child as FitMesh;
    const geometry = mesh.geometry;
    const position = geometry?.attributes?.position;
    if (!mesh.isMesh || !position || !isShown(mesh)) return;
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    const materialShown = (materialIndex: number) =>
      isShownMaterial(materials[materialIndex] ?? materials[0]);
    const push = (index: number) => {
      vertex.fromBufferAttribute(position, index);
      vertex.applyMatrix4(mesh.matrixWorld);
      points.push({ x: vertex.x, y: vertex.y, z: vertex.z });
    };
    const groups = geometry?.groups ?? [];
    if (!groups.length) {
      if (!materialShown(0)) return;
      for (let index = 0; index < position.count; index += 1) push(index);
      return;
    }
    const triangles = geometry?.index;
    for (const group of groups) {
      if (group.count <= 0 || !materialShown(group.materialIndex ?? 0))
        continue;
      const end = Math.min(
        group.start + group.count,
        triangles ? triangles.count : position.count
      );
      for (let index = group.start; index < end; index += 1)
        push(triangles ? triangles.getX(index) : index);
    }
  });
  return points;
}
