import type { Group, Mesh, Object3D } from "three";
import {
  SQ1_BODY_COLOR,
  SQ1_LAYER_HEIGHT,
  SQ1_MIDDLE_HEIGHT,
  SQ1_SLICE_ANGLE,
  SQ1_SLOT_DEGREES,
  cornerOutline,
  edgeOutline,
  middleHalfOutline,
  pieceSpecs,
  placementsOf,
  planPoint,
  prismArrays,
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
const rad = (degrees: number) => (degrees * Math.PI) / 180;

function pieceMesh(THREE: ThreeModule, spec: PieceSpec) {
  const outline = spec.kind === "edge" ? edgeOutline() : cornerOutline();
  const faces = spec.kind === "edge" ? [null, spec.low, null] : [null, spec.low, spec.high, null];
  const points = outline.points.map(point => ({ x: point.x * GAP, z: point.z * GAP }));
  const { positions, colors } = prismArrays(points, INNER, OUTER, spec.cap, faces);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ vertexColors: true }));
}

function middleMesh(THREE: ThreeModule, angle: number) {
  const outline = middleHalfOutline(angle).map(point => ({ x: point.x * GAP, z: point.z * GAP }));
  const { positions, colors } = prismArrays(outline, -INNER, INNER, "#2c2c33", []);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ vertexColors: true }));
}

export function createSquareOneModel(THREE: ThreeModule): SquareOneModel {
  const root = new THREE.Group();
  const pivotTop = new THREE.Group();
  const pivotBottom = new THREE.Group();
  const pivotSlice = new THREE.Group();
  root.add(pivotTop, pivotBottom, pivotSlice);

  const pieces = new Map<number, { holder: Group; body: Group; mesh: Mesh }>();
  for (const spec of pieceSpecs()) {
    const mesh = pieceMesh(THREE, spec);
    const body = new THREE.Group();
    body.add(mesh);
    const holder = new THREE.Group();
    holder.add(body);
    root.add(holder);
    pieces.set(spec.id, { holder, body, mesh });
  }
  const middleSlice = middleMesh(THREE, SQ1_SLICE_ANGLE);
  const middleOther = middleMesh(THREE, SQ1_SLICE_ANGLE + 180);
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

export const SQUARE_ONE_BODY_COLOR = SQ1_BODY_COLOR;
