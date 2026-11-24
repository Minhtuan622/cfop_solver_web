import type { PuzzleId } from "./puzzleIds";

export type PuzzlePlayer = HTMLElement & {
  puzzle: PuzzleId;
  experimentalSetupAlg: string;
  experimentalModel: {
    currentPattern: { get: () => Promise<{ patternData: unknown }> };
  };
  alg: string;
  visualization: "2D" | "3D";
  hintFacelets: "none";
  controlPanel: "none";
  backView: "none";
  background: "none";
  experimentalCurrentThreeJSPuzzleObject: (
    callback: () => void
  ) => Promise<unknown>;
  play?: () => void;
  pause?: () => void;
  tempoScale?: number;
  jumpToStart?: (options?: { flash: boolean }) => void;
};

export function startMountedTwistyPlayer(player: HTMLElement) {
  let target: object | null = player;
  while (target) {
    const startSymbol = Object.getOwnPropertySymbols(target).find(
      symbol => symbol.description === "intersectedCallback"
    );
    if (startSymbol) {
      const start = (target as Record<symbol, unknown>)[startSymbol];
      if (typeof start === "function") {
        void start.call(player);
        return;
      }
    }
    target = Object.getPrototypeOf(target);
  }
}

export const PREVIEW_RELOAD_FLAG = "cfop-3d-preview-reload";

export function isModuleLoadFailure(error: unknown): boolean {
  return /dynamically imported module|importing a module/i.test(
    String((error as { message?: string } | null | undefined)?.message ?? error)
  );
}

export function reloadPreviewPageOnce(): boolean {
  try {
    if (!window.sessionStorage.getItem(PREVIEW_RELOAD_FLAG)) {
      window.sessionStorage.setItem(PREVIEW_RELOAD_FLAG, "1");
      window.location.reload();
      return true;
    }
  } catch {
  }
  return false;
}

export function clearPreviewReloadFlag() {
  try {
    window.sessionStorage.removeItem(PREVIEW_RELOAD_FLAG);
  } catch {
  }
}
