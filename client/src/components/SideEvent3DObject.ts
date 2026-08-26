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

function sectorShape(THREE: ThreeModule, innerRadius: number, outerRadius: number, start: number, end: number) {
  const shape = new THREE.Shape();
  const point = (angle: number, radius: number) => {
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    const scale = radius / Math.pow(Math.pow(Math.abs(x), 4) + Math.pow(Math.abs(y), 4), 0.25);
    return { x: x * scale, y: y * scale };
  };
  const innerStart = point(start, innerRadius);
  shape.moveTo(innerStart.x, innerStart.y);
  for (let step = 0; step <= 8; step += 1) { const outer = point(start + ((end - start) * step) / 8, outerRadius); shape.lineTo(outer.x, outer.y); }
  const innerEnd = point(end, innerRadius);
  shape.lineTo(innerEnd.x, innerEnd.y);
  for (let step = 8; step >= 0; step -= 1) { const inner = point(start + ((end - start) * step) / 8, innerRadius); shape.lineTo(inner.x, inner.y); }
  return shape;
}

const SQUARE_EDGE_SIDE = "R-B-L-F-F-L-B-R-";
const SQUARE_CORNER_SIDE = "RBBLLFFRRFFLLBBR";

export function squareOneWedgeUnits(piece: number) { return piece % 2 === 1 ? 2 : 1; }
const CLOCK_FRONT_LAYOUT = [0, 3, 6, 1, 4, 7, 2, 5, 8];
const CLOCK_BACK_LAYOUT = [2, 10, 8, 9, 11, 13, 0, 12, 6];
export function clockDialIndex(column: number, row: number, back = false) { return (back ? CLOCK_BACK_LAYOUT : CLOCK_FRONT_LAYOUT)[column * 3 + row]; }

function squareOneSideColor(piece: number) {
  const face = (piece % 2 ? SQUARE_CORNER_SIDE : SQUARE_EDGE_SIDE)[piece] ?? "F";
  return CUBE_COLORS[face] ?? CUBE_COLORS.F;
}

function squareOneLayer(THREE: ThreeModule, wedges: PatternOrbit, startIndex: number, verticalBase: number) {
  const layer = new THREE.Group();
  const isTopLayer = verticalBase > 0;
  const sqa = Math.sqrt(3) / 2 + 1;
  const ep = [[0, 0], [-0.5, -sqa], [0.5, -sqa]];
  const cp = [[0, 0], [-0.5, -sqa], [-sqa, -sqa], [-sqa, -0.5]];
  const cpr = [[0, 0], [-0.5, -sqa], [-sqa, -sqa]];
  const cpl = [[0, 0], [-sqa, -sqa], [-sqa, -0.5]];
  const rotate = (points: number[][], angle: number) => points.map(([x, z]) => [x * Math.cos(angle) - z * Math.sin(angle), x * Math.sin(angle) + z * Math.cos(angle)]);
  const makeShape = (points: number[][]) => { const shape = new THREE.Shape(); points.forEach(([x, z], index) => index === 0 ? shape.moveTo(x, z) : shape.lineTo(x, z)); shape.closePath(); return shape; };
  const place = (points: number[][], color: string, topSticker = false) => {
    const shape = makeShape(points);
    const mesh = new THREE.Mesh(topSticker ? new THREE.ShapeGeometry(shape) : new THREE.ExtrudeGeometry(shape, { depth: 0.52, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color, roughness: 0.66, metalness: 0.03 }));
    mesh.rotation.x = isTopLayer ? -Math.PI / 2 : Math.PI / 2;
    mesh.position.y = verticalBase + (topSticker ? (isTopLayer ? 0.526 : -0.526) : 0);
    layer.add(mesh);
  };
  for (let position = 0; position < 12; position += 1) {
    const piece = wedges.pieces[startIndex + position] ?? startIndex + position;
    const colorUD = CUBE_COLORS[piece >= 8 ? "D" : "U"];
    const corner = piece % 2 === 1;
    const rotation = -(startIndex === 0 ? (position - 1) : (position - 6)) * Math.PI / 6;
    if (corner) {
      place(rotate(cpr, rotation), CUBE_COLORS[SQUARE_CORNER_SIDE[piece - 1] ?? "F"]);
      place(rotate(cpl, rotation), CUBE_COLORS[SQUARE_CORNER_SIDE[piece] ?? "F"]);
      place(rotate(cp, rotation), colorUD, true);
      position += 1;
    } else {
      place(rotate(ep, rotation - Math.PI / 6), CUBE_COLORS[SQUARE_EDGE_SIDE[piece] ?? "F"]);
      place(rotate(ep.map(([x, z]) => [x * 0.66, z * 0.66]), rotation - Math.PI / 6), colorUD, true);
    }
  }
  return layer;
}

function squareOneObject(THREE: ThreeModule, pattern: PatternData) {
  const root = new THREE.Group();
  const wedges = pattern.WEDGES;
  if (!wedges) throw new Error("Square-1 pattern is unavailable");
  const top = squareOneLayer(THREE, wedges, 0, 0.24);
  const bottom = squareOneLayer(THREE, wedges, 12, -0.24);
  const shell = new THREE.Mesh(new THREE.BoxGeometry(3.58, 0.12, 3.58), new THREE.MeshStandardMaterial({ color: "#222a35", roughness: 0.42, metalness: 0.3 }));
  shell.position.y = -0.03;
  const belt = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.3, 3.4), new THREE.MeshStandardMaterial({ color: wedges.pieces[0] >= 8 ? CUBE_COLORS.R : CUBE_COLORS.L, roughness: 0.48, metalness: 0.28 }));
  belt.position.y = -0.03;
  belt.rotation.y = (pattern.EQUATOR?.orientation[0] ?? 0) * Math.PI;
  root.add(shell, top, bottom, belt);
  root.userData.squareAnimation = { top, bottom, belt };
  return root;
}

function dial(THREE: ThreeModule, orientation: number, faceColor: string, back = false) {
  const dialGroup = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.49, 0.1, 32), new THREE.MeshStandardMaterial({ color: faceColor, roughness: 0.5, metalness: 0.18 }));
  plate.rotation.x = Math.PI / 2;
  dialGroup.add(plate);
  for (let mark = 0; mark < 12; mark += 1) {
    const angle = (mark / 12) * TAU;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.09, 0.024), new THREE.MeshBasicMaterial({ color: back ? "#d9e6ff" : "#232933" }));
    tick.position.set(Math.sin(angle) * 0.38, Math.cos(angle) * 0.38, back ? -0.06 : 0.06);
    tick.rotation.z = -angle;
    dialGroup.add(tick);
  }
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.33, 0.055), new THREE.MeshStandardMaterial({ color: back ? "#f4f0e8" : "#17221d", roughness: 0.42 }));
  hand.position.y = 0.17;
  hand.position.z = back ? -0.09 : 0.09;
  const pivot = new THREE.Group();
  pivot.rotation.z = -(orientation % 12) * CLOCK_UNIT;
  pivot.add(hand);
  dialGroup.add(pivot);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.1, 18, 12), new THREE.MeshStandardMaterial({ color: back ? "#f4f0e8" : "#17221d", roughness: 0.35 }));
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
      const item = dial(THREE, back ? (12 - orientation) % 12 : orientation, back ? "#405f92" : "#f1eee4", back);
      item.dialGroup.position.set(positions[column], positions[2 - row], back ? -0.27 : 0.27);
      pivots.push({ pivot: item.pivot, index });
      group.add(item.dialGroup);
    }
  }
  for (const [index, x, y] of [[0, -1.68, 1.68], [1, 1.68, 1.68], [2, -1.68, -1.68], [3, 1.68, -1.68]] as const) {
    const state = faceOrbit?.orientation[index + (back ? 9 : 0)] ?? 0;
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, state ? 0.25 : 0.12, 18), new THREE.MeshStandardMaterial({ color: state ? "#db6a4e" : "#2f9b72", roughness: 0.44 }));
    pin.rotation.x = Math.PI / 2;
    pin.position.set(x, y, 0.16);
    group.add(pin);
  }
  return group;
}

function clockObject(THREE: ThreeModule, pattern: PatternData) {
  const root = new THREE.Group();
  const dials = pattern.DIALS;
  if (!dials) throw new Error("Clock pattern is unavailable");
  const pivots: ClockHand[] = [];
  const frame = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.45, 0.36, 64), new THREE.MeshStandardMaterial({ color: "#222a35", roughness: 0.34, metalness: 0.42 }));
  frame.rotation.x = Math.PI / 2;
  root.add(frame);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.32, 0.1, 12, 64), new THREE.MeshStandardMaterial({ color: "#a8b4c4", roughness: 0.28, metalness: 0.72 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.z = 0.24;
  const front = clockFace(THREE, dials, pattern.FACES, pivots);
  front.position.z = 0.2;
  const back = clockFace(THREE, dials, pattern.FACES, pivots, true);
  back.position.z = -0.2;
  root.add(rim, front, back);
  root.rotation.y = ((pattern.FRAME?.orientation[0] ?? 0) % 2) * Math.PI;
  root.userData.clockAnimation = { pivots, pattern };
  return root;
}

function eventObject(THREE: ThreeModule, puzzle: SideEventPuzzle, pattern: PatternData) {
  return puzzle === "square1" ? squareOneObject(THREE, pattern) : clockObject(THREE, pattern);
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
  let current = eventObject(THREE, puzzle, initial);
  let currentPattern = initial;
  let frame: number | null = null;
  let stopped = false;
  let played = false;
  animationRoot.add(current);

  const replaceCurrent = (nextPattern: PatternData) => {
    animationRoot.remove(current);
    disposeObject(current);
    current = eventObject(THREE, puzzle, nextPattern);
    currentPattern = nextPattern;
    animationRoot.add(current);
  };
  const cancel = () => { stopped = true; if (frame !== null) window.cancelAnimationFrame(frame); frame = null; };
  const finish = () => { cancel(); const finalPattern = steps.at(-1)?.pattern ?? initial; replaceCurrent(finalPattern); };
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
