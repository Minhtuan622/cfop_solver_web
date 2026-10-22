import type { Group } from "three";
import { TAU, type PatternData, type PatternOrbit, type ThreeModule } from "./sideEventShared";

export const CLOCK_UNIT = TAU / 12;
export type ClockHand = { pivot: Group; index: number };

const CLOCK_FRONT_LAYOUT = [0, 3, 6, 1, 4, 7, 2, 5, 8];
const CLOCK_BACK_LAYOUT = [2, 10, 8, 9, 11, 13, 0, 12, 6];

export function clockDialIndex(column: number, row: number, back = false) { return (back ? CLOCK_BACK_LAYOUT : CLOCK_FRONT_LAYOUT)[column * 3 + row]; }

function dial(THREE: ThreeModule, orientation: number, faceColor: string, back = false) {
  const dialGroup = new THREE.Group();
  const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.49, 0.085, 40), new THREE.MeshStandardMaterial({ color: "#090b0e", roughness: 0.4, metalness: 0.45 }));
  bezel.rotation.x = Math.PI / 2;
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.405, 0.405, 0.095, 40), new THREE.MeshStandardMaterial({ color: faceColor, roughness: 0.48, metalness: 0.12 }));
  plate.rotation.x = Math.PI / 2;
  plate.position.z = back ? -0.025 : 0.025;
  dialGroup.add(bezel, plate);
  for (let mark = 0; mark < 12; mark += 1) {
    const angle = (mark / 12) * TAU;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.05, 0.02), new THREE.MeshBasicMaterial({ color: "#e6e8ea" }));
    tick.position.set(Math.sin(angle) * 0.445, Math.cos(angle) * 0.445, back ? -0.06 : 0.06);
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
  const hand = new THREE.Mesh(new THREE.ShapeGeometry(handShape), new THREE.MeshStandardMaterial({ color: "#13171c", roughness: 0.36, metalness: 0.24 }));
  hand.position.z = back ? -0.095 : 0.095;
  const pivot = new THREE.Group();
  pivot.rotation.z = -(orientation % 12) * CLOCK_UNIT;
  pivot.add(hand);
  dialGroup.add(pivot);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 12), new THREE.MeshStandardMaterial({ color: "#171a1f", roughness: 0.35, metalness: 0.3 }));
  hub.position.z = back ? -0.12 : 0.12;
  dialGroup.add(hub);
  return { dialGroup, pivot };
}

function clockFace(THREE: ThreeModule, dials: PatternOrbit, faceOrbit: PatternOrbit | undefined, pivots: ClockHand[], back = false) {
  const group = new THREE.Group();
  const positions = [-1.18, 0, 1.18];
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const index = clockDialIndex(column, row, back);
      const orientation = dials.orientation[index] ?? 0;
      const item = dial(THREE, back ? (12 - orientation) % 12 : orientation, "#f0f0ec", back);
      item.dialGroup.position.set(positions[column], positions[2 - row], back ? -0.31 : 0.31);
      pivots.push({ pivot: item.pivot, index });
      group.add(item.dialGroup);
    }
  }
  for (const [index, x, y] of [[0, -0.59, 0.59], [1, 0.59, 0.59], [2, -0.59, -0.59], [3, 0.59, -0.59]] as const) {
    const state = faceOrbit?.orientation[index + (back ? 9 : 0)] ?? 0;
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, state ? 0.2 : 0.1, 24), new THREE.MeshStandardMaterial({ color: "#c4c9cc", roughness: 0.25, metalness: 0.75 }));
    pin.rotation.x = Math.PI / 2;
    pin.position.set(x, y, back ? -0.35 : 0.35);
    group.add(pin);
  }
  return group;
}

function clockBolt(THREE: ThreeModule, angle: number, back = false) {
  const bolt = new THREE.Group();
  const radius = 2.05;
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.08, 18), new THREE.MeshStandardMaterial({ color: "#aeb5bc", roughness: 0.18, metalness: 0.9 }));
  screw.rotation.x = Math.PI / 2;
  screw.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, back ? -0.23 : 0.23);
  const groove = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.018, 0.025), new THREE.MeshBasicMaterial({ color: "#303840" }));
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
  const frame = new THREE.Mesh(new THREE.CylinderGeometry(2.46, 2.46, 0.38, 64), new THREE.MeshStandardMaterial({ color: "#b8bec5", roughness: 0.22, metalness: 0.82 }));
  frame.rotation.x = Math.PI / 2;
  root.add(frame);
  const board = new THREE.Mesh(new THREE.CylinderGeometry(2.27, 2.27, 0.12, 64), new THREE.MeshStandardMaterial({ color: "#17191c", roughness: 0.52, metalness: 0.18 }));
  board.rotation.x = Math.PI / 2;
  board.position.z = 0.21;
  const backBoard = board.clone();
  backBoard.position.z = -0.21;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.31, 0.095, 12, 64), new THREE.MeshStandardMaterial({ color: "#e4e6e8", roughness: 0.18, metalness: 0.9 }));
  rim.position.z = 0.3;
  const front = clockFace(THREE, dials, pattern.FACES, pivots);
  const back = clockFace(THREE, dials, pattern.FACES, pivots, true);
  const bolts = [Math.PI / 4, Math.PI * 3 / 4, Math.PI * 5 / 4, Math.PI * 7 / 4].flatMap((angle) => [clockBolt(THREE, angle), clockBolt(THREE, angle, true)]);
  root.add(board, backBoard, rim, front, back, ...bolts);
  root.rotation.y = ((pattern.FRAME?.orientation[0] ?? 0) % 2) * Math.PI;
  root.userData.clockAnimation = { pivots, pattern };
  return root;
}
