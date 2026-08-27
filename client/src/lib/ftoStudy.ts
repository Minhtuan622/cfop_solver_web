export type FtoSingleLayerLevel = {
  id: "first-turns" | "two-faces" | "single-layer";
  labelVi: string;
  descriptionVi: string;
  faces: readonly string[];
  length: number;
};

export type FtoSingleLayerAttempt = { id: string; levelId: FtoSingleLayerLevel["id"]; scramble: string; elapsedMs: number; completedAt: number };

export const FTO_SINGLE_LAYER_LEVELS: readonly FtoSingleLayerLevel[] = [
  { id: "first-turns", labelVi: "Bước 1 · Làm quen", descriptionVi: "3 nước ngắn với U và F để quen chiều xoay.", faces: ["U", "F"], length: 3 },
  { id: "two-faces", labelVi: "Bước 2 · Hai mặt", descriptionVi: "4 nước với U, F và R. Tập nhìn mảnh quay quanh mặt U.", faces: ["U", "F", "R"], length: 4 },
  { id: "single-layer", labelVi: "Bước 3 · Một tầng", descriptionVi: "5 nước ngắn quanh U, F, R và L. Khôi phục lại mặt U bằng lời giải gợi ý khi cần.", faces: ["U", "F", "R", "L"], length: 5 },
] as const;

const FTO_STUDY_STORAGE_KEY = "cfop-fto-single-layer-attempts";

export function createFtoSingleLayerScramble(level: FtoSingleLayerLevel, random = Math.random) {
  const moves: string[] = [];
  let previousFace = "";
  for (let index = 0; index < level.length; index += 1) {
    const options = level.faces.filter((face) => face !== previousFace);
    const face = options[Math.floor(random() * options.length)] ?? level.faces[0]!;
    const suffix = random() < 0.5 ? "" : "'";
    moves.push(`${face}${suffix}`);
    previousFace = face;
  }
  return moves.join(" ");
}

export function invertFtoScramble(scramble: string) {
  return scramble.trim().split(/\s+/).filter(Boolean).reverse().map((move) => move.endsWith("'") ? move.slice(0, -1) : `${move}'`).join(" ");
}

export function readFtoSingleLayerAttempts(storage: Pick<Storage, "getItem"> = localStorage): FtoSingleLayerAttempt[] {
  try {
    const value = JSON.parse(storage.getItem(FTO_STUDY_STORAGE_KEY) ?? "[]") as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is FtoSingleLayerAttempt => Boolean(item) && typeof item === "object" && typeof (item as FtoSingleLayerAttempt).id === "string" && typeof (item as FtoSingleLayerAttempt).scramble === "string" && typeof (item as FtoSingleLayerAttempt).elapsedMs === "number" && Number.isFinite((item as FtoSingleLayerAttempt).elapsedMs) && typeof (item as FtoSingleLayerAttempt).completedAt === "number").slice(0, 20);
  } catch { return []; }
}

export function writeFtoSingleLayerAttempts(attempts: readonly FtoSingleLayerAttempt[], storage: Pick<Storage, "setItem"> = localStorage) {
  storage.setItem(FTO_STUDY_STORAGE_KEY, JSON.stringify(attempts.slice(0, 20)));
}
