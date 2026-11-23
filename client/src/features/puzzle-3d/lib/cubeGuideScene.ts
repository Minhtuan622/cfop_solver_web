/**
 * Dựng cảnh Three.js cho `CubeGuide3D`: hình học dùng chung, từng cubie với
 * sticker theo state, vật liệu và việc căn mặt Cross xuống D. Module này import
 * Three.js nên chỉ được nạp cùng chunk tải lười của `CubeGuide3D`.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { CUBE_COLORS, CUBE_FALLBACK_COLOR } from "./cubeColors";
import { BODY, CELL_2, CELL_3, FACE_ORDER, indexFor } from "./cubeGuideFacelets";

const _geoSticker3 = new RoundedBoxGeometry(CELL_3 * 0.88, CELL_3 * 0.88, 0.052, 4, 0.075);
const _geoBody3 = new RoundedBoxGeometry(CELL_3 * 0.94, CELL_3 * 0.94, CELL_3 * 0.94, 4, 0.09);
const _geoSticker2 = new RoundedBoxGeometry(CELL_2 * 0.88, CELL_2 * 0.88, 0.052, 4, 0.075);
const _geoBody2 = new RoundedBoxGeometry(CELL_2 * 0.94, CELL_2 * 0.94, CELL_2 * 0.94, 4, 0.09);

export type Cubie = {
  unit: { x: number; y: number; z: number };
  group: THREE.Group;
  stickerMaterials: THREE.MeshLambertMaterial[];
};

export type TrackedScene = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  root: THREE.Group;
  /** Xoay whole-cube alignment (Cross → D) một lần cho toàn bộ scene con. */
  alignGroup: THREE.Group;
  host: HTMLDivElement;
  resize: () => void;
};

/**
 * Căn mặt Cross xuống D bằng một phép xoay cố định của TOÀN BỘ scene (alignGroup),
 * KHÔNG hoán vị facelet trong state.
 *
 * Trước đây state được hoán vị (x2/x'/z…) còn `move` giữ nguyên ký hiệu gốc,
 * nên layer mà animation xoay không trùng với layer thực sự bị xoay trong
 * state — cubie quay sai lớp và sticker nhảy loạn ở cuối mỗi bước.
 */
const ALIGN_ROTATIONS: Record<string, { axis: "x" | "z"; angle: number } | null> = {
  U: { axis: "z", angle: Math.PI }, // z2 — U ↔ D, xanh lá vẫn ở trước
  D: null,
  F: { axis: "x", angle: Math.PI / 2 }, // x — F → D
  B: { axis: "x", angle: -Math.PI / 2 }, // x' — B → D
  R: { axis: "z", angle: -Math.PI / 2 }, // z' — R → D
  L: { axis: "z", angle: Math.PI / 2 }, // z — L → D
};

/** Góc nhìn dọc (độ) khi khung vuông hoặc rộng hơn cao. */
export const BASE_FOV = 34;

export function alignQuaternionFor(crossColor: string) {
  const spec = ALIGN_ROTATIONS[crossColor] ?? null;
  const quaternion = new THREE.Quaternion();
  if (spec) {
    quaternion.setFromAxisAngle(
      spec.axis === "x" ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1),
      spec.angle
    );
  }
  return quaternion;
}

/** Giải phóng vật liệu của một nhóm đối tượng (hình học dùng chung nên KHÔNG dispose). */
export function disposeObject(object: THREE.Object3D) {
  object.traverse(node => {
    const mesh = node as THREE.Mesh;
    if (mesh.isMesh) {
      // Geometry được chia sẻ toàn cục (xem _geoSticker2/_geoBody2 …) — KHÔNG dispose.
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach(m => m.dispose());
      else material?.dispose();
    }
  });
}

/**
 * Dựng 26 cubie (hoặc 8 với 2×2) theo `nextState` và gắn vào `root`. `highlight`
 * là kết quả của `highlightedIndexes` (khoá `mặt:chỉ số` → màu phát sáng).
 */
export function buildCubies(
  root: THREE.Group,
  nextState: string,
  dimension: 2 | 3,
  highlight: ReturnType<typeof import("./cubeGuideFacelets").highlightedIndexes>
): Cubie[] {
  const cubies: Cubie[] = [];
  const cell = dimension === 2 ? CELL_2 : CELL_3;
  const coords = dimension === 2 ? [-1, 1] : [-1, 0, 1];

  const stickerGeometry = dimension === 2 ? _geoSticker2 : _geoSticker3;
  const bodyGeometry = dimension === 2 ? _geoBody2 : _geoBody3;

  for (const x of coords) {
    for (const y of coords) {
      for (const z of coords) {
        if (dimension === 3 && x === 0 && y === 0 && z === 0) continue;
        const group = new THREE.Group();
        group.position.set(x * cell, y * cell, z * cell);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: "#141414" });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);
        const cubie: Cubie = { unit: { x, y, z }, group, stickerMaterials: [] };
        for (const face of FACE_ORDER) {
          const exposed =
            (face === "U" && y === 1) ||
            (face === "D" && y === -1) ||
            (face === "F" && z === 1) ||
            (face === "B" && z === -1) ||
            (face === "R" && x === 1) ||
            (face === "L" && x === -1);
          if (!exposed) continue;
          const faceletIndex = indexFor(face, x, y, z);
          const faceIndex = faceletIndex % 9;
          const letter = nextState[faceletIndex] ?? "?";
          const color = CUBE_COLORS[letter] ?? CUBE_FALLBACK_COLOR;
          const highlightInfo = highlight.get(`${face}:${faceIndex}`);
          const material = new THREE.MeshLambertMaterial({
            color,
            emissive: highlightInfo ? new THREE.Color(highlightInfo.color) : new THREE.Color("#000000"),
            emissiveIntensity: highlightInfo?.intensity ?? 0,
          });
          const sticker = new THREE.Mesh(stickerGeometry, material);
          const offset = BODY / 2 + 0.026;
          switch (face) {
            case "U":
              sticker.position.set(0, offset, 0);
              sticker.rotation.set(-Math.PI / 2, 0, 0);
              break;
            case "D":
              sticker.position.set(0, -offset, 0);
              sticker.rotation.set(Math.PI / 2, 0, 0);
              break;
            case "F":
              sticker.position.set(0, 0, offset);
              break;
            case "B":
              sticker.position.set(0, 0, -offset);
              sticker.rotation.set(0, Math.PI, 0);
              break;
            case "R":
              sticker.position.set(offset, 0, 0);
              sticker.rotation.set(0, Math.PI / 2, 0);
              break;
            default: // L
              sticker.position.set(-offset, 0, 0);
              sticker.rotation.set(0, -Math.PI / 2, 0);
              break;
          }
          group.add(sticker);
          cubie.stickerMaterials.push(material);
        }
        root.add(group);
        cubies.push(cubie);
      }
    }
  }
  return cubies;
}
