import type { Group } from "three";

type ThreeModule = typeof import("three");
type SideEventPuzzle = "square1" | "clock";
type PatternOrbit = { pieces: number[]; orientation: number[] };
type PatternData = Record<string, PatternOrbit>;
type PatternState = { patternData: PatternData; applyAlg: (alg: string) => PatternState };
type PatternLoader = { kpuzzle: () => Promise<{ defaultPattern: () => PatternState }> };
type ClockHand = { pivot: Group; index: number };
type SideEventStep = { move: string; pattern: PatternData };

export type SideEvent3DAnimation = { object: Group; play: (render: () => void) => void; finish: () => void; cancel: () => void; dispose: () => void };

const CUBE_COLORS: Record<string, string> = { U: "#f7f3e9", R: "#d95743", F: "#1ba77a", D: "#e7c34f", L: "#ed8e42", B: "#3b6fc7" };
const TAU = Math.PI * 2;
const CLOCK_UNIT = TAU / 12;

export function isSideEvent3DPuzzle(puzzle: string): puzzle is SideEventPuzzle {
  return puzzle === "square1" || puzzle === "clock";
}

async function sideEventPatterns(puzzle: SideEventPuzzle, scramble: string) {
  const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
  const loader = (puzzle === "square1" ? puzzles.square1 : puzzles.clock) as unknown as PatternLoader;
  const kpuzzle = await loader.kpuzzle();
  let pattern = kpuzzle.defaultPattern();
  const initial = pattern.patternData;
  const steps: SideEventStep[] = [];
  for (const move of Array.from(new Alg(scramble).experimentalLeafMoves())) {
    const moveText = move.toString();
    pattern = pattern.applyAlg(moveText);
    steps.push({ move: moveText, pattern: pattern.patternData });
  }
  return { initial, steps };
}

const SQUARE_EDGE_SIDE = "R-B-L-F-F-L-B-R-";
const SQUARE_CORNER_SIDE = "RBBLLFFRRFFLLBBR";
const SQUARE1_SOLVED_WEDGES = [0, 1, 1, 2, 3, 3, 4, 5, 5, 6, 7, 7, 9, 9, 8, 11, 11, 10, 13, 13, 12, 12, 15, 14];
const SQUARE1_SQA = Math.sqrt(3) / 2 + 1;
type SquarePoint = [number, number];
export type SquareOneState = { wedges: number[]; middle: 0 | 1 };

export function squareOneWedgeUnits(piece: number) { return piece % 2 === 1 ? 2 : 1; }
export function squareOnePieceKind(piece: number) { return piece % 2 === 1 ? "corner" : "edge"; }
export type SquareOneVisualSlot = { position: number; piece: number; units: 1 | 2; kind: "edge" | "corner"; face: "U" | "D" };
export function squareOneVisualSlots(pieces: number[], startIndex: number): SquareOneVisualSlot[] {
  const slots: SquareOneVisualSlot[] = [];
  for (let position = 0; position < 12; position += 1) {
    const piece = pieces[startIndex + position] ?? startIndex + position;
    const units = squareOneWedgeUnits(piece) as 1 | 2;
    slots.push({ position, piece, units, kind: squareOnePieceKind(piece), face: piece >= 8 ? "D" : "U" });
    if (units === 2) position += 1;
  }
  return slots;
}

function rotateSquareLayer(wedges: number[], start: number, amount: number) {
  const source = wedges.slice(start, start + 12);
  const offset = ((amount % 12) + 12) % 12;
  for (let index = 0; index < 12; index += 1) wedges[start + index] = source[(index + offset) % 12] ?? source[index]!;
}

export function squareOneStateFromScramble(scramble: string): SquareOneState {
  const state: SquareOneState = { wedges: [...SQUARE1_SOLVED_WEDGES], middle: 0 };
  const tokens = scramble.match(/\(\s*-?\d+\s*,\s*-?\d+\s*\)|\//g) ?? [];
  for (const token of tokens) {
    if (token === "/") {
      const upperRight = state.wedges.slice(6, 12);
      state.wedges.splice(6, 6, ...state.wedges.slice(12, 18));
      state.wedges.splice(12, 6, ...upperRight);
      state.middle = state.middle === 0 ? 1 : 0;
      continue;
    }
    const match = token.match(/\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/);
    if (!match) continue;
    rotateSquareLayer(state.wedges, 0, Number(match[1]));
    rotateSquareLayer(state.wedges, 12, Number(match[2]));
  }
  return state;
}
const CLOCK_FRONT_LAYOUT = [0, 3, 6, 1, 4, 7, 2, 5, 8];
const CLOCK_BACK_LAYOUT = [2, 10, 8, 9, 11, 13, 0, 12, 6];
export function clockDialIndex(column: number, row: number, back = false) { return (back ? CLOCK_BACK_LAYOUT : CLOCK_FRONT_LAYOUT)[column * 3 + row]; }

function squareOneSideColor(piece: number, cornerFace = 0) {
  const index = ((piece % 16) + 16) % 16;
  const face = piece % 2 ? SQUARE_CORNER_SIDE[(index - 1 + cornerFace + 16) % 16] : SQUARE_EDGE_SIDE[index];
  return CUBE_COLORS[face] ?? CUBE_COLORS.F;
}

function rotateSquarePoints(points: SquarePoint[], angle: number): SquarePoint[] {
  return points.map(([x, z]) => [x * Math.cos(angle) - z * Math.sin(angle), x * Math.sin(angle) + z * Math.cos(angle)]);
}

function makeSquareShape(THREE: ThreeModule, points: SquarePoint[]) {
  const shape = new THREE.Shape();
  points.forEach(([x, z], index) => index === 0 ? shape.moveTo(x, z) : shape.lineTo(x, z));
  shape.closePath();
  return shape;
}

function squareOneVerticalPanel(THREE: ThreeModule, from: SquarePoint, to: SquarePoint, lowerY: number, upperY: number, color: string) {
  const [ax, az] = from;
  const [bx, bz] = to;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([ax, lowerY, az, bx, lowerY, bz, bx, upperY, bz, ax, upperY, az], 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.02, side: THREE.DoubleSide }));
}

function squareOneLayer(THREE: ThreeModule, state: SquareOneState, startIndex: number, verticalBase: number) {
  const layer = new THREE.Group();
  const isTopLayer = verticalBase > 0;
  const thickness = 0.46;
  const lowerY = isTopLayer ? verticalBase : verticalBase - thickness;
  const upperY = isTopLayer ? verticalBase + thickness : verticalBase;
  const stickerY = isTopLayer ? upperY + 0.004 : lowerY - 0.004;
  const neutralPiece = new THREE.MeshStandardMaterial({ color: "#252b31", roughness: 0.62, metalness: 0.01 });
  const edge: SquarePoint[] = [[0, 0], [-0.5, -SQUARE1_SQA], [0.5, -SQUARE1_SQA]];
  const corner: SquarePoint[] = [[0, 0], [-0.5, -SQUARE1_SQA], [-SQUARE1_SQA, -SQUARE1_SQA], [-SQUARE1_SQA, -0.5]];
  for (let position = 0; position < 12; position += 1) {
    const piece = state.wedges[startIndex + position] ?? SQUARE1_SOLVED_WEDGES[startIndex + position]!;
    const isCorner = piece % 2 === 1;
    const rotation = isCorner
      ? -(startIndex === 0 ? position - 1 : position - 6) * Math.PI / 6
      : -(startIndex === 0 ? position : position - 5) * Math.PI / 6;
    const points = rotateSquarePoints(isCorner ? corner : edge, rotation);
    const shape = makeSquareShape(THREE, points);
    const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false }), neutralPiece);
    body.rotation.x = isTopLayer ? -Math.PI / 2 : Math.PI / 2;
    body.position.y = verticalBase;
    const sticker = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color: CUBE_COLORS[piece >= 8 ? "D" : "U"], roughness: 0.48, metalness: 0.01 }));
    sticker.rotation.x = isTopLayer ? -Math.PI / 2 : Math.PI / 2;
    sticker.position.y = stickerY;
    layer.add(body, sticker);
    const panels: Array<[SquarePoint, SquarePoint, string]> = isCorner
      ? [[points[1]!, points[2]!, squareOneSideColor(piece)], [points[2]!, points[3]!, squareOneSideColor(piece, 1)]]
      : [[points[1]!, points[2]!, squareOneSideColor(piece)]];
    panels.forEach(([from, to, color]) => layer.add(squareOneVerticalPanel(THREE, from, to, lowerY, upperY, color)));
    if (isCorner) position += 1;
  }
  return layer;
}

function squareOneObject(THREE: ThreeModule, state: SquareOneState) {
  const root = new THREE.Group();
  const top = squareOneLayer(THREE, state, 0, 0.12);
  const bottom = squareOneLayer(THREE, state, 12, -0.12);
  const belt = new THREE.Group();
  const beltCore = new THREE.Mesh(new THREE.BoxGeometry(3.31, 0.23, 3.31), new THREE.MeshStandardMaterial({ color: "#171d23", roughness: 0.5, metalness: 0.26 }));
  belt.add(beltCore);
  const beltFaces: Array<[number, number, number, string, boolean]> = [
    [0, 1.705, 0, CUBE_COLORS.R, true], [0, -1.705, 0, CUBE_COLORS.L, true],
    [1.705, 0, 0, CUBE_COLORS.F, false], [-1.705, 0, 0, CUBE_COLORS.B, false],
  ];
  beltFaces.forEach(([x, z, rotation, color, side]) => {
    const band = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.13, 0.035), new THREE.MeshStandardMaterial({ color, roughness: 0.46, metalness: 0.03 }));
    band.position.set(x, 0, z);
    band.rotation.y = side ? rotation : Math.PI / 2;
    belt.add(band);
  });
  belt.rotation.y = state.middle * Math.PI;
  root.add(top, bottom, belt);
  root.userData.squareAnimation = { top, bottom, belt };
  return root;
}

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

function clockObject(THREE: ThreeModule, pattern: PatternData) {
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

function eventObject(THREE: ThreeModule, puzzle: SideEventPuzzle, pattern: PatternData, squareState?: SquareOneState) {
  return puzzle === "square1" ? squareOneObject(THREE, squareState ?? squareOneStateFromScramble("")) : clockObject(THREE, pattern);
}

function disposeObject(object: Group) {
  object.traverse((child) => {
    const disposable = child as typeof child & { geometry?: { dispose: () => void }; material?: { dispose: () => void } | { dispose: () => void }[] };
    disposable.geometry?.dispose();
    if (Array.isArray(disposable.material)) disposable.material.forEach((material) => material.dispose());
    else disposable.material?.dispose();
  });
}

export function squareTurnForAnimation(move: string) {
  const match = move.match(/^(U|D)_SQ_(\d*)('?)/);
  if (!match) return null;
  const amount = (match[2] ? Number(match[2]) : 1) * (match[3] ? -1 : 1);
  return { layer: match[1] === "U" ? "top" : "bottom", angle: amount * (TAU / 12) } as const;
}

export function squareSlashPose(progress: number) {
  const phase = Math.max(0, Math.min(1, progress));
  const lift = Math.sin(Math.PI * phase) * 0.34;
  return { topY: lift, bottomY: lift === 0 ? 0 : -lift, topAngle: Math.PI * phase, bottomAngle: phase === 0 ? 0 : -Math.PI * phase, beltScaleY: 1 + lift * 1.6 };
}

function shortestAngle(from: number, to: number) {
  return ((to - from + Math.PI * 3) % TAU) - Math.PI;
}

export async function sideEvent3DAnimation(THREE: ThreeModule, puzzle: SideEventPuzzle, scramble: string): Promise<SideEvent3DAnimation> {
  const { initial, steps } = await sideEventPatterns(puzzle, scramble);
  const animationRoot = new THREE.Group();
  const squareInitialState = puzzle === "square1" ? squareOneStateFromScramble("") : undefined;
  const squareFinalState = puzzle === "square1" ? squareOneStateFromScramble(scramble) : undefined;
  let current = eventObject(THREE, puzzle, initial, squareInitialState);
  let currentPattern = initial;
  let frame: number | null = null;
  let stopped = false;
  let played = false;
  animationRoot.add(current);

  const replaceCurrent = (nextPattern: PatternData, nextSquareState = squareFinalState) => {
    animationRoot.remove(current);
    disposeObject(current);
    current = eventObject(THREE, puzzle, nextPattern, nextSquareState);
    currentPattern = nextPattern;
    animationRoot.add(current);
  };
  const cancel = () => { stopped = true; if (frame !== null) window.cancelAnimationFrame(frame); frame = null; };
  const finish = () => { cancel(); const finalPattern = steps.at(-1)?.pattern ?? initial; replaceCurrent(finalPattern, squareFinalState); };
  const play = (render: () => void) => {
    if (played || stopped || !steps.length) return;
    played = true;
    const baseDuration = Math.max(72, Math.min(150, 1_200 / steps.length));
    let index = 0;
    const next = () => {
      if (stopped) return;
      const step = steps[index];
      if (!step) { frame = null; return; }
      const startedAt = performance.now();
      const square = puzzle === "square1" ? squareTurnForAnimation(step.move) : null;
      const isSlash = puzzle === "square1" && step.move === "/";
      const duration = isSlash ? 260 : baseDuration;
      const squareData = current.userData.squareAnimation as { top: Group; bottom: Group; belt: Group } | undefined;
      const clockData = current.userData.clockAnimation as { pivots: ClockHand[]; pattern: PatternData } | undefined;
      const fromFrame = current.rotation.y;
      const targetFrame = ((step.pattern.FRAME?.orientation[0] ?? 0) % 2) * Math.PI;
      const tick = (now: number) => {
        if (stopped) return;
        const linear = Math.min(1, (now - startedAt) / duration);
        const eased = linear * linear * (3 - 2 * linear);
        if (square && squareData) squareData[square.layer].rotation.y = square.angle * eased;
        if (isSlash && squareData) {
          const slash = squareSlashPose(eased);
          squareData.top.position.y = slash.topY;
          squareData.bottom.position.y = slash.bottomY;
          squareData.top.rotation.y = slash.topAngle;
          squareData.bottom.rotation.y = slash.bottomAngle;
          squareData.belt.scale.y = slash.beltScaleY;
        }
        if (clockData) {
          const fromDials = currentPattern.DIALS?.orientation ?? [];
          const toDials = step.pattern.DIALS?.orientation ?? [];
          clockData.pivots.forEach(({ pivot, index: dialIndex }) => {
            const from = -(fromDials[dialIndex] ?? 0) * CLOCK_UNIT;
            const to = -(toDials[dialIndex] ?? 0) * CLOCK_UNIT;
            pivot.rotation.z = from + shortestAngle(from, to) * eased;
          });
          current.rotation.y = fromFrame + shortestAngle(fromFrame, targetFrame) * eased;
        }
        render();
        if (linear < 1) { frame = window.requestAnimationFrame(tick); return; }
        replaceCurrent(step.pattern);
        render();
        index += 1;
        frame = window.requestAnimationFrame(next);
      };
      frame = window.requestAnimationFrame(tick);
    };
    next();
  };
  return { object: animationRoot, play, finish, cancel, dispose: () => { cancel(); disposeObject(current); animationRoot.clear(); } };
}
