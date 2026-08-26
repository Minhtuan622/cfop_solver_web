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

const SIDE_COLORS = ["#d95743", "#3b6fc7", "#1ba77a", "#ed8e42", "#f7f3e9", "#e7c34f"];
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
  const unit = TAU / 12;
  let position = 0;
  while (position < 12) {
    const piece = wedges.pieces[startIndex + position] ?? startIndex + position;
    const next = wedges.pieces[startIndex + position + 1] ?? -1;
    const units = position < 11 && pairOfCornerWedges(piece, next) ? 2 : 1;
    const orientation = wedges.orientation[startIndex + position] ?? 0;
    const start = -Math.PI / 2 + position * unit + 0.012;
    const end = -Math.PI / 2 + (position + units) * unit - 0.012;
    const shape = sectorShape(THREE, 0.64, 1.84, start, end);
    const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.55, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: SIDE_COLORS[Math.abs(piece + orientation) % SIDE_COLORS.length], roughness: 0.72, metalness: 0.04 }));
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
  const slashPivot = new THREE.Group();
  const top = squareOneLayer(THREE, wedges, 0, 0.24);
  const bottom = squareOneLayer(THREE, wedges, 12, -0.24);
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(1.86, 1.86, 0.22, 48), new THREE.MeshStandardMaterial({ color: "#252a31", roughness: 0.48, metalness: 0.34 }));
  belt.position.y = -0.03;
  slashPivot.add(top, bottom, belt);
  root.add(slashPivot);
  root.userData.squareAnimation = { top, bottom, slashPivot };
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

function clockFace(THREE: ThreeModule, dials: PatternOrbit, faceOrbit: PatternOrbit | undefined, offset: number, pivots: ClockHand[], back = false) {
  const group = new THREE.Group();
  const positions = [-1.18, 0, 1.18];
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const index = offset + row * 3 + column;
      const item = dial(THREE, dials.orientation[index] ?? 0, back ? "#405f92" : "#f1eee4", back);
      item.dialGroup.position.set(positions[column], positions[2 - row], back ? -0.27 : 0.27);
      pivots.push({ pivot: item.pivot, index });
      group.add(item.dialGroup);
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
  const pivots: ClockHand[] = [];
  const frame = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.25, 0.34, 48), new THREE.MeshStandardMaterial({ color: "#222a35", roughness: 0.36, metalness: 0.56 }));
  frame.rotation.x = Math.PI / 2;
  root.add(frame);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.18, 0.09, 12, 48), new THREE.MeshStandardMaterial({ color: "#96a2b3", roughness: 0.3, metalness: 0.72 }));
  rim.rotation.x = Math.PI / 2;
  root.add(rim, clockFace(THREE, dials, pattern.FACES, 0, pivots), clockFace(THREE, dials, pattern.FACES, 9, pivots, true));
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
    const duration = Math.max(72, Math.min(150, 1_200 / steps.length));
    let index = 0;
    const next = () => {
      if (stopped) return;
      const step = steps[index];
      if (!step) { frame = null; return; }
      const startedAt = performance.now();
      const square = puzzle === "square1" ? squareTurnForAnimation(step.move) : null;
      const isSlash = puzzle === "square1" && step.move === "/";
      const squareData = current.userData.squareAnimation as { top: Group; bottom: Group; slashPivot: Group } | undefined;
      const clockData = current.userData.clockAnimation as { pivots: ClockHand[]; pattern: PatternData } | undefined;
      const fromFrame = current.rotation.y;
      const targetFrame = ((step.pattern.FRAME?.orientation[0] ?? 0) % 2) * Math.PI;
      const tick = (now: number) => {
        if (stopped) return;
        const linear = Math.min(1, (now - startedAt) / duration);
        const eased = linear * linear * (3 - 2 * linear);
        if (square && squareData) squareData[square.layer].rotation.y = square.angle * eased;
        if (isSlash && squareData) squareData.slashPivot.rotation.z = Math.PI * eased;
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
