import { useCallback, useEffect, useRef, useState } from "react";
import type { SolverResult } from "@/lib/solverRuntime";
import { phaseAt } from "./solutionView";

export type CubeMotionKind = "idle" | "move" | "seek" | "phase" | "reset";
export type CursorIntent = "step" | "playback" | "seek" | "phase" | "reset";

export type CubeMotion = {
  id: number;
  kind: CubeMotionKind;
  direction: "forward" | "backward";
  phaseName?: string;
};

export type PlaybackSource = {
  trace: readonly unknown[];
  phases?: SolverResult["phases"];
};

export type PlaybackOptions = {
  delayFor?: (cursor: number, speed: number) => number;
};

export function useSolverPlayback(result: PlaybackSource | null, options: PlaybackOptions = {}) {
  const delayForRef = useRef(options.delayFor);
  delayForRef.current = options.delayFor;
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [cubeMotion, setCubeMotion] = useState<CubeMotion>({
    id: 0,
    kind: "idle",
    direction: "forward",
  });
  const cursorRef = useRef(0);
  const motionIdRef = useRef(0);

  const updateCursor = useCallback(
    (next: number, intent: CursorIntent = "seek") => {
      const limit = result?.trace.length ?? 0;
      const target = Math.max(0, Math.min(limit, next));
      const previous = cursorRef.current;
      if (target === previous) return;
      const direction =
        target >= previous ? ("forward" as const) : ("backward" as const);
      const solver = result && result.phases?.length ? (result as SolverResult) : null;
      const fromPhase = phaseAt(solver, previous)?.name;
      const toPhase = phaseAt(solver, target)?.name;
      const distance = Math.abs(target - previous);
      const kind: CubeMotionKind =
        intent === "reset" || target === 0
          ? "reset"
          : intent === "phase" || (distance > 1 && fromPhase !== toPhase)
            ? "phase"
            : distance === 1
              ? "move"
              : "seek";
      cursorRef.current = target;
      setCubeMotion({
        id: ++motionIdRef.current,
        kind,
        direction,
        phaseName: toPhase,
      });
      setCursor(target);
    },
    [result]
  );

  useEffect(() => {
    if (!playing || !result) return;
    if (delayForRef.current) {
      let timer = 0;
      const step = () => {
        const next = cursorRef.current + 1;
        if (next > result.trace.length) {
          setPlaying(false);
          return;
        }
        updateCursor(next, "playback");
        timer = window.setTimeout(step, delayForRef.current!(next, playbackSpeed));
      };
      timer = window.setTimeout(step, delayForRef.current(cursorRef.current, playbackSpeed));
      return () => window.clearTimeout(timer);
    }
    const id = window.setInterval(
      () => {
        const next = cursorRef.current + 1;
        if (next > result.trace.length) {
          setPlaying(false);
          return;
        }
        updateCursor(next, "playback");
      },
      Math.max(100, Math.round(700 / playbackSpeed))
    );
    return () => window.clearInterval(id);
  }, [playbackSpeed, playing, result, updateCursor]);

  const selectCursor = (next: number, intent: CursorIntent = "seek") => {
    setPlaying(false);
    updateCursor(next, intent);
  };

  const resetToStart = () => {
    cursorRef.current = 0;
    setCubeMotion({
      id: ++motionIdRef.current,
      kind: "reset",
      direction: "forward",
    });
    setCursor(0);
  };

  return {
    cursor,
    setCursor,
    playing,
    setPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    cubeMotion,
    selectCursor,
    resetToStart,
  };
}
