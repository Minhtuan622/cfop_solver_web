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
  alignGroup: THREE.Group;
  host: HTMLDivElement;
  resize: () => void;
};

export const BASE_FOV = 34;

export function disposeObject(object: THREE.Object3D) {
  object.traverse(node => {
    const mesh = node as THREE.Mesh;
    if (mesh.isMesh) {
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach(m => m.dispose());
      else material?.dispose();
    }
  });
}

export function buildCubies(
  root: THREE.Group,
  nextState: string,
  dimension: 2 | 3
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
          const letter = nextState[faceletIndex] ?? "?";
          const color = CUBE_COLORS[letter] ?? CUBE_FALLBACK_COLOR;
          const material = new THREE.MeshLambertMaterial({ color });
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
            default:
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
