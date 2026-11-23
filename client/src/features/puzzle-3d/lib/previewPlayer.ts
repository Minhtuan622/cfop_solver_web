/**
 * Tiện ích cho `<twisty-player>` của Cubing.js dùng trong preview 3D: kiểu của
 * player, khởi động player đã gắn vào DOM, và nhận diện lỗi tải module.
 * Không import Three.js/Cubing để giữ nguyên ranh giới chunk.
 */
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

/** Cờ sessionStorage đánh dấu trang đã được nạp lại một lần để cứu lỗi 3D. */
export const PREVIEW_RELOAD_FLAG = "cfop-3d-preview-reload";

/**
 * Lỗi tải module (import động hỏng). Module map của trình duyệt cache luôn cả
 * thất bại, nên thử lại `import()` trong cùng document sẽ fail ngay mà không
 * có request mạng nào nữa — chỉ nạp lại trang (document mới) mới xoá được cache.
 */
export function isModuleLoadFailure(error: unknown): boolean {
  return /dynamically imported module|importing a module/i.test(
    String((error as { message?: string } | null | undefined)?.message ?? error)
  );
}

/**
 * Nạp lại trang một lần để cứu lỗi 3D (cờ sessionStorage chặn vòng lặp nạp lại).
 * Trả về `true` khi đã gọi nạp lại; `false` khi đã nạp một lần rồi hoặc
 * sessionStorage bị chặn — lúc đó người gọi dựng lại trong trang.
 */
export function reloadPreviewPageOnce(): boolean {
  try {
    if (!window.sessionStorage.getItem(PREVIEW_RELOAD_FLAG)) {
      window.sessionStorage.setItem(PREVIEW_RELOAD_FLAG, "1");
      window.location.reload();
      return true;
    }
  } catch {
    /* sessionStorage có thể bị chặn — dựng lại trong trang. */
  }
  return false;
}

/** Xoá cờ "đã nạp lại trang": gọi khi preview dựng xong để lần hỏng sau vẫn được nạp lại. */
export function clearPreviewReloadFlag() {
  try {
    window.sessionStorage.removeItem(PREVIEW_RELOAD_FLAG);
  } catch {
    /* sessionStorage có thể bị chặn — bỏ qua. */
  }
}
