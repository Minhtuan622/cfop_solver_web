import type { Group } from "three";
import type { SideEventPuzzle } from "./puzzleIds";
import { TAU, type PatternData, type PatternLoader, type ThreeModule } from "./sideEventShared";
import { CLOCK_UNIT, clockObject, type ClockHand } from "./clockGeometry";
import { squareOneObject } from "./squareOneGeometry";
import { squareOneStateFromScramble, squareSlashPose, squareTurnForAnimation, type SquareOneState } from "./squareOneState";

export type SideEvent3DAnimation = { object: Group; play: (render: () => void) => void; finish: () => void; cancel: () => void; dispose: () => void };

type SideEventStep = { move: string; pattern: PatternData };

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
