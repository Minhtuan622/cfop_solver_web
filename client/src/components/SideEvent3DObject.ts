import type { Group } from "three";

type ThreeModule = typeof import("three");
type SideEventPuzzle = "square1" | "clock";
type PatternOrbit = { pieces: number[]; orientation: number[] };
type PatternData = Record<string, PatternOrbit>;
type PatternLoader = { kpuzzle: () => Promise<{ defaultPattern: () => { applyAlg: (alg: string) => { patternData: PatternData } } }> };

const SIDE_COLORS = ["#d95743", "#3b6fc7", "#1ba77a", "#ed8e42", "#f7f3e9", "#e7c34f"];

export function isSideEvent3DPuzzle(puzzle: string): puzzle is SideEventPuzzle {
  return puzzle === "square1" || puzzle === "clock";
}

async function sideEventPattern(puzzle: SideEventPuzzle, scramble: string) {
  const { puzzles } = await import("cubing/puzzles");
  const loader = (puzzle === "square1" ? puzzles.square1 : puzzles.clock) as unknown as PatternLoader;
  return (await loader.kpuzzle()).defaultPattern().applyAlg(scramble).patternData;
}

function sectorShape(THREE: ThreeModule, innerRadius: number, outerRadius: number, start: number, end: number) {
  const shape = new THREE.Shape();
  shape.moveTo(Math.cos(start) * innerRadius, Math.sin(start) * innerRadius);
  shape.absarc(0, 0, outerRadius, start, end, false);
  shape.lineTo(Math.cos(end) * innerRadius, Math.sin(end) * innerRadius);
  shape.absarc(0, 0, innerRadius, end, start, true);
  return shape;
}

function pairOfCornerWedges(first: number, second: number) {
  return Math.floor(first / 3) === Math.floor(second / 3) && first % 3 !== 2 && second % 3 !== 2;
}

function squareOneLayer(THREE: ThreeModule, wedges: PatternOrbit, startIndex: number, verticalBase: number) {
  const layer = new THREE.Group();
  const isTopLayer = verticalBase > 0;
  const unit = (Math.PI * 2) / 12;
  let position = 0;
  while (position < 12) {
    const piece = wedges.pieces[startIndex + position] ?? startIndex + position;
    const next = wedges.pieces[startIndex + position + 1] ?? -1;
    const units = position < 11 && pairOfCornerWedges(piece, next) ? 2 : 1;
    const orientation = wedges.orientation[startIndex + position] ?? 0;
    const start = -Math.PI / 2 + position * unit + 0.012;
    const end = -Math.PI / 2 + (position + units) * unit - 0.012;
    const shape = sectorShape(THREE, 0.64, 1.84, start, end);
    const body = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: 0.55, bevelEnabled: false }),
      new THREE.MeshStandardMaterial({ color: SIDE_COLORS[Math.abs(piece + orientation) % SIDE_COLORS.length], roughness: 0.72, metalness: 0.04 }),
    );
    body.rotation.x = isTopLayer ? -Math.PI / 2 : Math.PI / 2;
    body.position.y = verticalBase;
    layer.add(body);
    const face = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color: piece < 12 ? "#f7f3e9" : "#e7c34f", roughness: 0.58, metalness: 0.02 }));
    face.rotation.x = isTopLayer ? -Math.PI / 2 : Math.PI / 2;
    face.position.y = verticalBase + (isTopLayer ? 0.556 : -0.006);
    layer.add(face);
    position += units;
  }
  return layer;
}

function squareOneObject(THREE: ThreeModule, pattern: PatternData) {
  const root = new THREE.Group();
  const wedges = pattern.WEDGES;
  if (!wedges) throw new Error("Square-1 pattern is unavailable");
  root.add(squareOneLayer(THREE, wedges, 0, 0.24));
  root.add(squareOneLayer(THREE, wedges, 12, -0.24));
  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(1.86, 1.86, 0.22, 48),
    new THREE.MeshStandardMaterial({ color: "#252a31", roughness: 0.48, metalness: 0.34 }),
  );
  belt.position.y = -0.03;
  root.add(belt);
  return root;
}

function dial(THREE: ThreeModule, orientation: number, faceColor: string, back = false) {
  const dialGroup = new THREE.Group();
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.49, 0.49, 0.1, 32),
    new THREE.MeshStandardMaterial({ color: faceColor, roughness: 0.5, metalness: 0.18 }),
  );
  plate.rotation.x = Math.PI / 2;
  dialGroup.add(plate);
  for (let mark = 0; mark < 12; mark += 1) {
    const angle = (mark / 12) * Math.PI * 2;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.09, 0.024), new THREE.MeshBasicMaterial({ color: back ? "#d9e6ff" : "#232933" }));
    tick.position.set(Math.sin(angle) * 0.38, Math.cos(angle) * 0.38, back ? -0.06 : 0.06);
    tick.rotation.z = -angle;
    dialGroup.add(tick);
  }
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.33, 0.055), new THREE.MeshStandardMaterial({ color: back ? "#f4f0e8" : "#17221d", roughness: 0.42 }));
  hand.position.y = 0.17;
  hand.position.z = back ? -0.09 : 0.09;
  const pivot = new THREE.Group();
  pivot.rotation.z = -(orientation % 12) * (Math.PI * 2 / 12);
  pivot.add(hand);
  dialGroup.add(pivot);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.1, 18, 12), new THREE.MeshStandardMaterial({ color: back ? "#f4f0e8" : "#17221d", roughness: 0.35 }));
  hub.position.z = back ? -0.12 : 0.12;
  dialGroup.add(hub);
  return dialGroup;
}

function clockFace(THREE: ThreeModule, dials: PatternOrbit, faceOrbit: PatternOrbit | undefined, offset: number, back = false) {
  const group = new THREE.Group();
  const positions = [-1.18, 0, 1.18];
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const index = offset + row * 3 + column;
      const item = dial(THREE, dials.orientation[index] ?? 0, back ? "#405f92" : "#f1eee4", back);
      item.position.set(positions[column], positions[2 - row], back ? -0.27 : 0.27);
      group.add(item);
    }
  }
  for (const [index, x, y] of [[0, -1.88, 1.88], [1, 1.88, 1.88], [2, -1.88, -1.88], [3, 1.88, -1.88]] as const) {
    const state = faceOrbit?.pieces[index + offset] ?? index;
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, state % 2 ? 0.25 : 0.12, 18), new THREE.MeshStandardMaterial({ color: state % 2 ? "#db6a4e" : "#2f9b72", roughness: 0.44 }));
    pin.rotation.x = Math.PI / 2;
    pin.position.set(x, y, back ? -0.38 : 0.38);
    group.add(pin);
  }
  return group;
}

function clockObject(THREE: ThreeModule, pattern: PatternData) {
  const root = new THREE.Group();
  const dials = pattern.DIALS;
  if (!dials) throw new Error("Clock pattern is unavailable");
  const frame = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.25, 0.34, 48), new THREE.MeshStandardMaterial({ color: "#222a35", roughness: 0.36, metalness: 0.56 }));
  frame.rotation.x = Math.PI / 2;
  root.add(frame);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.18, 0.09, 12, 48), new THREE.MeshStandardMaterial({ color: "#96a2b3", roughness: 0.3, metalness: 0.72 }));
  rim.rotation.x = Math.PI / 2;
  root.add(rim);
  root.add(clockFace(THREE, dials, pattern.FACES, 0));
  root.add(clockFace(THREE, dials, pattern.FACES, 9, true));
  if ((pattern.FRAME?.orientation[0] ?? 0) % 2) root.rotation.y = Math.PI;
  return root;
}

export async function sideEvent3DObject(THREE: ThreeModule, puzzle: SideEventPuzzle, scramble: string): Promise<Group> {
  const pattern = await sideEventPattern(puzzle, scramble);
  return puzzle === "square1" ? squareOneObject(THREE, pattern) : clockObject(THREE, pattern);
}
