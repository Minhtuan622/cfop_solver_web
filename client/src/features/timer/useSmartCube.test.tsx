// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { puzzles } from "cubing/puzzles";
import { Alg, Move } from "cubing/alg";
import type { KPattern } from "cubing/kpuzzle";
import { useSmartCube } from "./useSmartCube";

const h = vi.hoisted(() => ({
  fake: null as ReturnType<typeof makeFakeCube> | null,
}));

vi.mock("@/features/timer/lib/smartCube", () => ({
  connectSmartCube: vi.fn(async () => h.fake),
  connectSmartCubeUnsupportedReason: () => "idle",
  isSmartCubeSupported: () => true,
}));

vi.mock("@/contexts/LanguageContext", async () => {
  const { translate } = await import("@/lib/i18n");
  return {
    useLanguage: () => ({
      language: "vi" as const,
      t: (key: string, params?: Record<string, string | number>) =>
        translate("vi", key, params),
    }),
  };
});

function makeFakeCube(initial: KPattern) {
  const listeners: Array<(event: unknown) => void> = [];
  const cube = {
    pattern: initial,
    stopped: false,
    disconnected: false,
    name: () => "FakeCube 9000",
    battery: 87,
    getPattern: async () => cube.pattern,
    getBattery: async () => cube.battery,
    addAlgLeafListener: (listener: (event: never) => void) => {
      listeners.push(listener as (event: unknown) => void);
    },
    stopTrackingMoves: () => {
      cube.stopped = true;
    },
    disconnect: () => {
      cube.disconnected = true;
    },
    emit(moveStr: string) {
      const move = Move.fromString(moveStr);
      cube.pattern = cube.pattern.applyMove(move);
      for (const listener of listeners) {
        listener({
          latestAlgLeaf: move,
          timeStamp: Date.now(),
          pattern: cube.pattern,
        });
      }
    },
  };
  return cube;
}

const SOLVED_4 = "R U R' U'";
const kpuzzlePromise = puzzles["3x3x3"].kpuzzle();

beforeEach(() => {
  h.fake = null;
});

afterEach(() => cleanup());

async function setup(
  targetScramble: string,
  buildTarget: (kpuzzle: Awaited<typeof kpuzzlePromise>) => KPattern,
) {
  const kpuzzle = await kpuzzlePromise;
  const cube = makeFakeCube(buildTarget(kpuzzle));
  h.fake = cube;
  const onSolveComplete = vi.fn();
  const rendered = renderHook(() =>
    useSmartCube({
      enabled: true,
      targetScramble,
      onSolveComplete,
    }),
  );
  await act(async () => {
    await rendered.result.current.connect();
  });
  return { ...rendered, cube, onSolveComplete };
}

const atScramble =
  (scramble: string) =>
  (kpuzzle: Awaited<typeof kpuzzlePromise>) =>
    kpuzzle.defaultPattern().applyAlg(new Alg(scramble));

describe("useSmartCube", () => {
  it("connects: battery, name, phase ready when cube is at the scramble", async () => {
    const { result } = await setup(SOLVED_4, atScramble(SOLVED_4));
    expect(result.current.status).toBe("connected");
    expect(result.current.batteryPercent).toBe(87);
    expect(result.current.cubeName).toBe("FakeCube 9000");
    expect(result.current.phase).toBe("ready");
    expect(result.current.state).toHaveLength(54);
  });

  it("detects a full solve: arm → first move → solved → onSolveComplete", async () => {
    const { result, cube, onSolveComplete } = await setup(SOLVED_4, atScramble(SOLVED_4));
    expect(result.current.phase).toBe("ready");

    const inverseMoves = ["U", "R", "U'", "R'"];
    for (const move of inverseMoves) {
      act(() => cube.emit(move));
    }

    await waitFor(() => expect(onSolveComplete).toHaveBeenCalledTimes(1));
    expect(onSolveComplete.mock.calls[0][0].moves).toEqual(inverseMoves);
    expect(result.current.phase).toBe("completed");
  });

  it("arms only after the cube reaches the scramble (mid-scramble connect)", async () => {
    const kpuzzle = await kpuzzlePromise;
    const solved = kpuzzle.defaultPattern();
    const cube = makeFakeCube(solved);
    h.fake = cube;
    const onSolveComplete = vi.fn();
    const { result } = renderHook(() =>
      useSmartCube({
        enabled: true,
        targetScramble: SOLVED_4,
        onSolveComplete,
      }),
    );
    await act(async () => {
      await result.current.connect();
    });
    expect(result.current.phase).toBe("idle");

    for (const move of ["R", "U", "R'", "U'"]) {
      act(() => cube.emit(move));
    }
    await waitFor(() => expect(result.current.phase).toBe("ready"));

    for (const move of ["U", "R", "U'", "R'"]) {
      act(() => cube.emit(move));
    }
    await waitFor(() => expect(onSolveComplete).toHaveBeenCalledTimes(1));
    expect(result.current.phase).toBe("completed");
  });

  it("keeps detection disabled for an unparseable scramble", async () => {
    const { result, cube } = await setup("?? not alg ??", (kpuzzle: Awaited<typeof kpuzzlePromise>) => kpuzzle.defaultPattern());
    expect(result.current.phase).toBe("idle");
    act(() => cube.emit("R"));
    expect(result.current.phase).toBe("idle");
  });

  it("errors out instead of faking a solved cube when the state read fails", async () => {
    const kpuzzle = await kpuzzlePromise;
    const cube = makeFakeCube(kpuzzle.defaultPattern());
    cube.getPattern = async () => {
      throw new Error("transient BLE failure");
    };
    h.fake = cube;
    const onSolveComplete = vi.fn();
    const { result } = renderHook(() =>
      useSmartCube({
        enabled: true,
        targetScramble: SOLVED_4,
        onSolveComplete,
      }),
    );
    await act(async () => {
      await result.current.connect();
    });
    expect(result.current.status).toBe("error");
    expect(result.current.errorKey).toBe("failed");
    expect(cube.disconnected).toBe(true);
    expect(cube.stopped).toBe(true);
    expect(onSolveComplete).not.toHaveBeenCalled();
  });

  it("does not detect solves once detection is disabled (room submitted)", async () => {
    const kpuzzle = await kpuzzlePromise;
    const cube = makeFakeCube(kpuzzle.defaultPattern());
    h.fake = cube;
    const onSolveComplete = vi.fn();
    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useSmartCube({
          enabled,
          targetScramble: SOLVED_4,
          onSolveComplete,
        }),
      { initialProps: { enabled: true } },
    );
    await act(async () => {
      await result.current.connect();
    });
    for (const move of ["R", "U", "R'", "U'"]) {
      act(() => cube.emit(move));
    }
    await waitFor(() => expect(result.current.phase).toBe("ready"));

    rerender({ enabled: false });
    for (const move of ["U", "R", "U'", "R'"]) {
      act(() => cube.emit(move));
    }
    // Wait a beat; no completion must be recorded.
    await waitFor(() => expect(result.current.phase).not.toBe("completed"));
    expect(onSolveComplete).not.toHaveBeenCalled();
  });

  it("disconnects cleanly", async () => {
    const { result, cube } = await setup(SOLVED_4, atScramble(SOLVED_4));
    act(() => result.current.disconnect());
    expect(result.current.status).toBe("idle");
    expect(result.current.state).toBeNull();
    expect(cube.disconnected).toBe(true);
    expect(cube.stopped).toBe(true);
  });
});



