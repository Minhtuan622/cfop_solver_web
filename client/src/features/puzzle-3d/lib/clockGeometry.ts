import type { Group } from "three";
import {
  TAU,
  type PatternData,
  type PatternOrbit,
  type ThreeModule,
} from "./sideEventShared";
import { CUBE_COLORS } from "./cubeColors";

export const CLOCK_UNIT = TAU / 12;
export type ClockHand = { pivot: Group; index: number };

const CLOCK_FRONT_LAYOUT = [0, 3, 6, 1, 4, 7, 2, 5, 8];
/** Back dials use the KPuzzle indices 9-17, row-major as seen from behind. */
const CLOCK_BACK_LAYOUT = [11, 14, 17, 10, 13, 16, 9, 12, 15];

export function clockDialIndex(column: number, row: number, back = false) {
  return (back ? CLOCK_BACK_LAYOUT : CLOCK_FRONT_LAYOUT)[column * 3 + row];
}

function dial(
  THREE: ThreeModule,
  orientation: number,
  faceColor: string,
  back = false
) {
  const dialGroup = new THREE.Group();
  const bezel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.49, 0.49, 0.085, 40),
    new THREE.MeshStandardMaterial({
      color: "#090b0e",
      roughness: 0.5,
      metalness: 0.3,
    })
  );
  bezel.rotation.x = Math.PI / 2;
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.465, 0.465, 0.095, 40),
    new THREE.MeshStandardMaterial({
      color: faceColor,
      roughness: 0.42,
      metalness: 0,
    })
  );
  plate.rotation.x = Math.PI / 2;
  dialGroup.add(bezel, plate);
  for (let mark = 0; mark < 12; mark += 1) {
    const angle = (mark / 12) * TAU;
    const tick = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.05, 0.02),
      new THREE.MeshBasicMaterial({ color: "#3a3f46" })
    );
    tick.position.set(
      Math.sin(angle) * 0.445,
      Math.cos(angle) * 0.445,
      back ? -0.06 : 0.06
    );
    tick.rotation.z = -angle;
    dialGroup.add(tick);
  }
  const handShape = new THREE.Shape();
  handShape.moveTo(-0.055, 0.02);
  handShape.lineTo(-0.07, 0.24);
  handShape.lineTo(0, 0.36);
  handShape.lineTo(0.07, 0.24);
  handShape.lineTo(0.055, 0.02);
  handShape.closePath();
  const hand = new THREE.Mesh(
    new THREE.ShapeGeometry(handShape),
    new THREE.MeshStandardMaterial({
      color: "#13171c",
      roughness: 0.36,
      metalness: 0.24,
      side: THREE.DoubleSide,
    })
  );
  hand.position.z = back ? -0.095 : 0.095;
  const pivot = new THREE.Group();
  pivot.rotation.z = -(orientation % 12) * CLOCK_UNIT;
  pivot.add(hand);
  dialGroup.add(pivot);
  const hub = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 18, 12),
    new THREE.MeshStandardMaterial({
      color: "#171a1f",
      roughness: 0.35,
      metalness: 0.3,
    })
  );
  hub.position.z = back ? -0.12 : 0.12;
  dialGroup.add(hub);
  return { dialGroup, pivot };
}

function clockFace(
  THREE: ThreeModule,
  dials: PatternOrbit,
  pivots: ClockHand[],
  back = false
) {
  const group = new THREE.Group();
  const positions = [-1.18, 0, 1.18];
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const index = clockDialIndex(column, row, back);
      const orientation = dials.orientation[index] ?? 0;
      const item = dial(
        THREE,
        back ? (12 - orientation) % 12 : orientation,
        "#f8f8f4",
        back
      );
      item.dialGroup.position.set(
        positions[column],
        positions[2 - row],
        back ? -0.31 : 0.31
      );
      pivots.push({ pivot: item.pivot, index });
      group.add(item.dialGroup);
    }
  }
  // Pin state is not part of the KPuzzle definition, so pins rest flush.
  for (const [x, y] of [
    [-0.59, 0.59],
    [0.59, 0.59],
    [-0.59, -0.59],
    [0.59, -0.59],
  ] as const) {
    const pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.1, 24),
      new THREE.MeshStandardMaterial({
        color: "#2a2f36",
        roughness: 0.4,
        metalness: 0.3,
      })
    );
    pin.rotation.x = Math.PI / 2;
    pin.position.set(x, y, back ? -0.35 : 0.35);
    group.add(pin);
  }
  return group;
}

function clockBolt(THREE: ThreeModule, angle: number, back = false) {
  const bolt = new THREE.Group();
  const radius = 2.05;
  const screw = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.095, 0.08, 18),
    new THREE.MeshStandardMaterial({
      color: "#aeb5bc",
      roughness: 0.18,
      metalness: 0.9,
    })
  );
  screw.rotation.x = Math.PI / 2;
  screw.position.set(
    Math.cos(angle) * radius,
    Math.sin(angle) * radius,
    back ? -0.23 : 0.23
  );
  const groove = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.018, 0.025),
    new THREE.MeshBasicMaterial({ color: "#303840" })
  );
  groove.position.copy(screw.position);
  groove.position.z += back ? -0.045 : 0.045;
  bolt.add(screw, groove);
  return bolt;
}

export function clockObject(THREE: ThreeModule, pattern: PatternData) {
  const root = new THREE.Group();
  const dials = pattern.DIALS;
  if (!dials) throw new Error("Clock pattern is unavailable");
  const pivots: ClockHand[] = [];
  // The real Rubik's Clock is a yellow plastic case with white dial plates.
  const yellow = CUBE_COLORS.D;
  const frame = new THREE.Mesh(
    new THREE.CylinderGeometry(2.46, 2.46, 0.38, 64),
    new THREE.MeshStandardMaterial({
      color: yellow,
      roughness: 0.5,
      metalness: 0.04,
    })
  );
  frame.rotation.x = Math.PI / 2;
  root.add(frame);
  const board = new THREE.Mesh(
    new THREE.CylinderGeometry(2.27, 2.27, 0.12, 64),
    new THREE.MeshStandardMaterial({
      color: yellow,
      roughness: 0.55,
      metalness: 0.02,
    })
  );
  board.rotation.x = Math.PI / 2;
  board.position.z = 0.21;
  const backBoard = board.clone();
  backBoard.position.z = -0.21;
  const front = clockFace(THREE, dials, pivots);
  const back = clockFace(THREE, dials, pivots, true);
  const bolts = [
    Math.PI / 4,
    (Math.PI * 3) / 4,
    (Math.PI * 5) / 4,
    (Math.PI * 7) / 4,
  ].flatMap(angle => [clockBolt(THREE, angle), clockBolt(THREE, angle, true)]);
  root.add(board, backBoard, front, back, ...bolts);
  root.rotation.y = ((pattern.FRAME?.orientation[0] ?? 0) % 2) * Math.PI;
  root.userData.clockAnimation = { pivots, pattern };
  return root;
}
