import type { Group, Mesh, Object3D } from "three";
import {
  SQ1_PALETTE,
  SQ1_LAYER_HEIGHT,
  SQ1_MIDDLE_HEIGHT,
  SQ1_SLICE_ANGLE,
  SQ1_SLOT_DEGREES,
  cornerOutline,
  edgeOutline,
  middleHalfOutline,
  middleWalls,
  pieceSpecs,
  placementsOf,
  planPoint,
  type PieceSpec,
} from "./squareOneGeometry";
import type { ThreeModule } from "./threeTypes";

export type SquareOneMotion =
  | { kind: "turn"; top: number; bottom: number; progress: number }
  | { kind: "slice"; progress: number };

export type SquareOneModel = {
  root: Group;
  // Lays the model out for a state; `flips` counts the slices so far, which is
  // what decides whether the middle layer is turned over.
  pose(state: readonly number[], flips: number, motion?: SquareOneMotion): void;
  dispose(): void;
};

const INNER = SQ1_MIDDLE_HEIGHT / 2;
const OUTER = INNER + SQ1_LAYER_HEIGHT;
const GAP = 0.985;
const BEVEL = 0.03;
const STICKER_DEPTH = 0.012;
const STICKER_INSET = 0.045;
const rad = (degrees: number) => (degrees * Math.PI) / 180;

type Plan = { x: number; z: number };

// The plan outline as a three.js shape: its y axis becomes -z once the
// extrusion is stood up, so the z coordinates flip sign.
function shapeOf(THREE: ThreeModule, points: readonly Plan[]) {
  const shape = new THREE.Shape();
  points.forEach((point, index) => {
    if (index === 0) shape.moveTo(point.x, -point.z);
    else shape.lineTo(point.x, -point.z);
  });
  shape.closePath();
  return shape;
}

// A beveled slab over an outline from `y0` to `y1`.
function slabGeometry(THREE: ThreeModule, points: readonly Plan[], y0: number, y1: number) {
  const geometry = new THREE.ExtrudeGeometry(shapeOf(THREE, points), {
    depth: y1 - y0 - 2 * BEVEL,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelOffset: -BEVEL,
    bevelSegments: 2,
    steps: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, y0 + BEVEL, 0);
  return geometry;
}

function insetPlan(points: readonly Plan[], inset: number): Plan[] {
  const centre = points.reduce((sum, point) => ({ x: sum.x + point.x / points.length, z: sum.z + point.z / points.length }), { x: 0, z: 0 });
  const reach = Math.max(...points.map(point => Math.hypot(point.x - centre.x, point.z - centre.z)));
  const scale = Math.max(0.1, 1 - inset / reach);
  return points.map(point => ({ x: centre.x + (point.x - centre.x) * scale, z: centre.z + (point.z - centre.z) * scale }));
}

function roundedRect(THREE: ThreeModule, width: number, height: number, radius: number) {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);
  const shape = new THREE.Shape();
  shape.moveTo(-w, -h + r);
  shape.lineTo(-w, h - r);
  shape.quadraticCurveTo(-w, h, -w + r, h);
  shape.lineTo(w - r, h);
  shape.quadraticCurveTo(w, h, w, h - r);
  shape.lineTo(w, -h + r);
  shape.quadraticCurveTo(w, -h, w - r, -h);
  shape.lineTo(-w + r, -h);
  shape.quadraticCurveTo(-w, -h, -w, -h + r);
  return shape;
}

const stickerMaterial = (THREE: ThreeModule, color: string) =>
  new THREE.MeshPhongMaterial({ color, specular: 0x444444, shininess: 60 });
const bodyMaterial = (THREE: ThreeModule) =>
  new THREE.MeshPhongMaterial({ color: SQ1_PALETTE.BODY, specular: 0x222222, shininess: 25 });

// A raised, rounded sticker on the wall between two plan points.
function wallSticker(THREE: ThreeModule, from: Plan, to: Plan, y0: number, y1: number, color: string) {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = Math.hypot(dx, dz);
  const width = Math.max(0.02, length - 2 * STICKER_INSET);
  const height = Math.max(0.02, y1 - y0 - 2 * STICKER_INSET);
  const geometry = new THREE.ExtrudeGeometry(roundedRect(THREE, width, height, Math.min(width, height) * 0.14), {
    depth: STICKER_DEPTH,
    bevelEnabled: false,
  });
  const mesh = new THREE.Mesh(geometry, stickerMaterial(THREE, color));
  // Travelling clockwise from above, the outside is to the left of the wall.
  const normal = { x: dz / length, z: -dx / length };
  mesh.position.set((from.x + to.x) / 2, (y0 + y1) / 2, (from.z + to.z) / 2);
  mesh.rotation.y = Math.atan2(normal.x, normal.z);
  return mesh;
}

function pieceGroup(THREE: ThreeModule, spec: PieceSpec) {
  const outline = spec.kind === "edge" ? edgeOutline() : cornerOutline();
  const points = outline.points.map(point => ({ x: point.x * GAP, z: point.z * GAP }));
  const group = new THREE.Group();
  group.add(new THREE.Mesh(slabGeometry(THREE, points, INNER, OUTER), bodyMaterial(THREE)));

  const cap = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shapeOf(THREE, insetPlan(points, 0.12)), { depth: STICKER_DEPTH, bevelEnabled: false }),
    stickerMaterial(THREE, spec.cap)
  );
  cap.rotation.x = -Math.PI / 2;
  cap.position.y = OUTER;
  group.add(cap);

  const colors = spec.kind === "edge" ? [null, spec.low, null] : [null, spec.low, spec.high, null];
  points.forEach((from, index) => {
    const color = colors[index];
    if (color) group.add(wallSticker(THREE, from, points[(index + 1) % points.length], INNER, OUTER, color));
  });
  return group;
}

function middleGroup(THREE: ThreeModule, angle: number) {
  const outline = middleHalfOutline(angle);
  const group = new THREE.Group();
  group.add(new THREE.Mesh(slabGeometry(THREE, outline.map(point => ({ x: point.x * GAP, z: point.z * GAP })), -INNER, INNER), bodyMaterial(THREE)));
  for (const wall of middleWalls(outline)) {
    const from = { x: wall.from.x * GAP, z: wall.from.z * GAP };
    const to = { x: wall.to.x * GAP, z: wall.to.z * GAP };
    group.add(wallSticker(THREE, from, to, -INNER, INNER, wall.color));
  }
  return group;
}

export function createSquareOneModel(THREE: ThreeModule): SquareOneModel {
  const root = new THREE.Group();
  const pivotTop = new THREE.Group();
  const pivotBottom = new THREE.Group();
  const pivotSlice = new THREE.Group();
  root.add(pivotTop, pivotBottom, pivotSlice);

  const pieces = new Map<number, { holder: Group; body: Group }>();
  for (const spec of pieceSpecs()) {
    const body = pieceGroup(THREE, spec);
    const holder = new THREE.Group();
    holder.add(body);
    root.add(holder);
    pieces.set(spec.id, { holder, body });
  }
  const middleSlice = middleGroup(THREE, SQ1_SLICE_ANGLE);
  const middleOther = middleGroup(THREE, SQ1_SLICE_ANGLE + 180);
  const middleHolder = new THREE.Group();
  middleHolder.add(middleSlice);
  root.add(middleHolder, middleOther);

  const axisPoint = planPoint(SQ1_SLICE_ANGLE, 1);
  const axis = new THREE.Vector3(axisPoint.x, 0, axisPoint.z).normalize();

  const attach = (object: Object3D, parent: Object3D) => {
    if (object.parent !== parent) parent.add(object);
  };

  function pose(state: readonly number[], flips: number, motion?: SquareOneMotion) {
    pivotTop.rotation.set(0, 0, 0);
    pivotBottom.rotation.set(0, 0, 0);
    pivotSlice.quaternion.identity();
    if (motion?.kind === "turn") {
      pivotTop.rotation.y = -rad(motion.top * SQ1_SLOT_DEGREES * motion.progress);
      pivotBottom.rotation.y = rad(motion.bottom * SQ1_SLOT_DEGREES * motion.progress);
    }
    if (motion?.kind === "slice") pivotSlice.quaternion.setFromAxisAngle(axis, Math.PI * motion.progress);

    for (const placement of placementsOf(state)) {
      const piece = pieces.get(placement.id);
      if (!piece) continue;
      piece.holder.rotation.set(0, -rad(placement.angle), 0);
      piece.body.rotation.set(0, 0, placement.flipped ? Math.PI : 0);
      const inSliceHalf = placement.layer === 0 ? placement.start >= 6 : placement.start < 6;
      attach(
        piece.holder,
        motion?.kind === "slice" && inSliceHalf
          ? pivotSlice
          : placement.layer === 0
            ? pivotTop
            : pivotBottom
      );
    }
    // The half of the middle layer that turns with the slice is turned over
    // after an odd number of slices.
    middleHolder.quaternion.identity();
    if (flips % 2 === 1) middleHolder.quaternion.setFromAxisAngle(axis, Math.PI);
    attach(middleHolder, motion?.kind === "slice" ? pivotSlice : root);
  }

  return {
    root,
    pose,
    dispose() {
      root.traverse(object => {
        const mesh = object as Mesh;
        mesh.geometry?.dispose?.();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach(item => item.dispose());
        else material?.dispose?.();
      });
    },
  };
}

