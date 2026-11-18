/**
 * useSmartCube — pairs a Bluetooth smart cube and tracks solves end-to-end.
 *
 * Flow: connect → seed the cube's *current* physical state (mid-scramble
 * connects work) → track every move event → watch the cube reach the target
 * scramble (arm) → first move starts the clock → solved stops it and fires
 * `onSolveComplete` once.
 *
 * Detection is only enabled for 3×3×3 (the physical puzzle). Other events
 * see "connected" with live state/moves, but no auto start/stop.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { KPattern } from "cubing/kpuzzle";
import {
  kpatternToFacelets,
  getSolvedPattern,
  patternFromAlg,
} from "./lib/kpatternFacelets";
import {
  BluetoothTimerError,
  type BluetoothTimerErrorKey,
} from "./lib/bluetoothTimer";
import {
  connectSmartCube,
  connectSmartCubeUnsupportedReason,
  isSmartCubeSupported,
  type SmartCubeHandle,
} from "./lib/smartCube";

export type SmartCubeStatus =
  | "unsupported"
  | "idle"
  | "connecting"
  | "connected"
  | "error";

export type SmartCubePhase = "idle" | "ready" | "solving" | "completed";

export type SmartCubeSolveResult = {
  moves: string[];
  elapsedMs: number;
};

export type SmartCubeOptions = {
  /** Master switch — false disables auto detection (kept manual). */
  enabled: boolean;
  /** Current scramble; the cube must reach this exact state before arming. */
  targetScramble: string;
  onSolveComplete?: (result: SmartCubeSolveResult) => void;
};

export type SmartCube = {
  status: SmartCubeStatus;
  cubeName: string | null;
  batteryPercent: number | null;
  errorKey: BluetoothTimerErrorKey | null;
  /** Detection lifecycle: idle → ready (matches scramble) → solving → completed. */
  phase: SmartCubePhase;
  /** Live facelet string for the net view, or null before the first read. */
  state: string | null;
  moves: string[];
  /** Seconds-based TPS since the first move (null while idle/ready). */
  tps: number | null;
  /** Number of moves in the current (or just finished) solve. */
  movesCount: number;
  connect: () => Promise<void>;
  disconnect: () => void;
};

async function targetPatternOf(scramble: string): Promise<KPattern | null> {
  try {
    return await patternFromAlg(scramble);
  } catch {
    return null; // unparseable scramble — detection stays off
  }
}

export function useSmartCube({
  enabled,
  targetScramble,
  onSolveComplete,
}: SmartCubeOptions): SmartCube {
  const [status, setStatus] = useState<SmartCubeStatus>(() =>
    connectSmartCubeUnsupportedReason(),
  );
  const [cubeName, setCubeName] = useState<string | null>(null);
  const [batteryPercent, setBatteryPercent] = useState<number | null>(null);
  const [errorKey, setErrorKey] = useState<BluetoothTimerErrorKey | null>(
    null,
  );
  const [phase, setPhase] = useState<SmartCubePhase>("idle");
  const [state, setState] = useState<string | null>(null);
  const [moves, setMoves] = useState<string[]>([]);
  const [tps, setTps] = useState<number | null>(null);

  const cubeRef = useRef<SmartCubeHandle | null>(null);
  const mountedRef = useRef(true);
  const currentRef = useRef<KPattern | null>(null);
  const targetRef = useRef<KPattern | null>(null);
  const phaseRef = useRef<SmartCubePhase>("idle");
  const movesRef = useRef<string[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const onSolveCompleteRef = useRef(onSolveComplete);
  onSolveCompleteRef.current = onSolveComplete;

  const publishPhase = useCallback((next: SmartCubePhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const publishProgress = useCallback(() => {
    setState(currentRef.current ? kpatternToFacelets(currentRef.current) : null);
    setMoves([...movesRef.current]);
    const started = startedAtRef.current;
    setTps(
      started === null || movesRef.current.length === 0
        ? null
        : movesRef.current.length / ((performance.now() - started) / 1000),
    );
  }, []);

  const evaluateProgress = useCallback(async () => {
    const current = currentRef.current;
    if (!current || !enabled) return;
    const solved = await getSolvedPattern();
    const isSolved = current.isIdentical(solved);
    const isTarget = targetRef.current
      ? current.isIdentical(targetRef.current)
      : false;

    if (phaseRef.current === "completed") {
      // Leave the completed state once the cube moves away from solved —
      // otherwise a re-scramble would keep the UI "done" forever.
      if (!isSolved) publishPhase("idle");
      return;
    }
    if (isSolved) {
      if (phaseRef.current === "solving" || phaseRef.current === "ready") {
        publishPhase("completed");
        const started = startedAtRef.current;
        onSolveCompleteRef.current?.({
          moves: [...movesRef.current],
          elapsedMs: started === null ? 0 : performance.now() - started,
        });
      }
      return;
    }
    if (phaseRef.current === "idle") {
      if (isTarget) {
        publishPhase("ready");
        movesRef.current = [];
        startedAtRef.current = null;
        setMoves([]);
        setTps(null);
      }
      return;
    }
    if (phaseRef.current === "ready" && !isTarget) {
      publishPhase("solving");
      startedAtRef.current = performance.now();
    }
  }, [enabled, publishPhase]);

  // Tear the cube down on unmount; a cube that finishes pairing afterwards
  // is stopped immediately and never reports progress.
  useEffect(
    () => () => {
      mountedRef.current = false;
      const cube = cubeRef.current;
      cubeRef.current = null;
      try {
        cube?.stopTrackingMoves?.();
        cube?.disconnect();
      } catch {
        /* already gone */
      }
    },
    [],
  );

  // Recompute the target pattern whenever the scramble (or the enabled
  // flag) changes.
  useEffect(() => {
    targetRef.current = null;
    movesRef.current = [];
    startedAtRef.current = null;
    publishPhase("idle");
    setMoves([]);
    setTps(null);

    let stale = false;
    void (async () => {
      const pattern = enabled ? await targetPatternOf(targetScramble) : null;
      if (stale || !mountedRef.current) return;
      targetRef.current = pattern;
      // If the cube is connected and already at the target, arm now.
      void evaluateProgress();
    })();

    return () => {
      stale = true;
    };
  }, [targetScramble, enabled, evaluateProgress, publishPhase]);

  const connect = useCallback(async () => {
    if (!isSmartCubeSupported()) {
      setStatus("unsupported");
      return;
    }
    setStatus("connecting");
    setErrorKey(null);
    try {
      const cube = await connectSmartCube();
      if (!mountedRef.current) {
        try {
          cube.stopTrackingMoves?.();
          cube.disconnect();
        } catch {
          /* already gone */
        }
        return;
      }

      cubeRef.current = cube;

      // Seed the cube's *current* physical state (mid-scramble connects work).
      let current: KPattern;
      try {
        current = await cube.getPattern();
      } catch {
        current = await getSolvedPattern(); // read failed — treat as solved
      }
      currentRef.current = current;
      setState(kpatternToFacelets(current));

      // Battery (best effort).
      try {
        const raw = await cube.getBattery?.();
        setBatteryPercent(
          typeof raw === "number"
            ? Math.max(0, Math.min(100, Math.round(raw)))
            : null,
        );
      } catch {
        setBatteryPercent(null);
      }

      setCubeName(cube.name() ?? "Smart Cube");
      setStatus("connected");

      cube.addAlgLeafListener(event => {
        if (!mountedRef.current) return;
        const move = event.latestAlgLeaf as { quantum?: unknown };
        // Only Move nodes carry a `quantum`; comments/other leaves don't.
        if (!move || typeof move !== "object" || move.quantum === undefined)
          return;
        try {
          currentRef.current = currentRef.current
            ? currentRef.current.applyMove(move as never)
            : null;
        } catch {
          return; // unknown move encoding — drop it rather than corrupt state
        }
        movesRef.current = [...movesRef.current, move.toString()];
        publishProgress();
        void evaluateProgress();
      });

      void evaluateProgress();
    } catch (error) {
      cubeRef.current = null;
      setCubeName(null);
      setStatus("error");
      setErrorKey(
        error instanceof BluetoothTimerError ? error.key : "failed",
      );
    }
  }, [evaluateProgress, publishProgress]);

  const disconnect = useCallback(() => {
    const cube = cubeRef.current;
    cubeRef.current = null;
    try {
      cube?.stopTrackingMoves?.();
      cube?.disconnect();
    } catch {
      /* already gone */
    }
    currentRef.current = null;
    setCubeName(null);
    setBatteryPercent(null);
    setState(null);
    setMoves([]);
    setTps(null);
    publishPhase("idle");
    movesRef.current = [];
    startedAtRef.current = null;
    setStatus(current =>
      current === "unsupported" ? current : "idle",
    );
  }, [publishPhase]);

  return {
    status,
    cubeName,
    batteryPercent,
    errorKey,
    phase,
    state,
    moves,
    tps,
    movesCount: moves.length,
    connect,
    disconnect,
  };
}
