import { SOLVED_FAST_STATE } from "@/lib/fastCube";

export type LayerSelection = { oSl: number; oSr: number };
export const DEFAULT_LAYER_SELECTION: LayerSelection = { oSl: 1, oSr: 1 };
export const MAX_LAYER = 2;

export function layerSelectionForKey(
  selection: LayerSelection,
  key: string,
): LayerSelection | null {
  switch (key) {
    case "3":
      return { ...selection, oSl: Math.max(1, selection.oSl - 1) };
    case "4":
      return { ...selection, oSl: Math.min(MAX_LAYER, selection.oSl + 1) };
    case "7":
      return { ...selection, oSr: Math.min(MAX_LAYER, selection.oSr + 1) };
    case "8":
      return { ...selection, oSr: Math.max(1, selection.oSr - 1) };
    case " ":
      return DEFAULT_LAYER_SELECTION;
    default:
      return null;
  }
}

export type PlayKeyAction =
  | { kind: "move"; move: string; rotation: boolean }
  | { kind: "camera"; yaw: number; pitch: number }
  | { kind: "layer"; selection: LayerSelection }
  | { kind: "space" }
  | { kind: "escape" };

export function normalizePlayKey(event: {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
}): string | null {
  if (event.altKey || event.ctrlKey || event.metaKey) return null;
  if (event.key === " " || event.key === "Spacebar") return " ";
  if (event.key.length === 1) return event.key.toLowerCase();
  const lower = event.key.toLowerCase();
  if (lower.startsWith("arrow")) return lower;
  if (lower === "escape") return "escape";
  return null;
}

export function playActionForKey(
  key: string,
  selection: LayerSelection,
): PlayKeyAction | null {
  switch (key) {
    case " ":
      return { kind: "space" };
    case "escape":
      return { kind: "escape" };
    case "arrowleft":
      return { kind: "camera", yaw: -1, pitch: 0 };
    case "arrowright":
      return { kind: "camera", yaw: 1, pitch: 0 };
    case "arrowup":
      return { kind: "camera", yaw: 0, pitch: 1 };
    case "arrowdown":
      return { kind: "camera", yaw: 0, pitch: -1 };
    case "3":
    case "4":
    case "7":
    case "8": {
      const next = layerSelectionForKey(selection, key);
      return next ? { kind: "layer", selection: next } : null;
    }
    default:
      return moveForKey(key, selection);
  }
}

function faceMove(base: string, wide: string, selection: 1 | 2, prime: boolean) {
  return selection === 2 ? (prime ? `${wide}'` : wide) : prime ? `${base}'` : base;
}

function moveForKey(
  key: string,
  selection: LayerSelection,
): PlayKeyAction | null {
  const { oSl, oSr } = selection;
  const move = (token: string, rotation = false): PlayKeyAction => ({
    kind: "move",
    move: token,
    rotation,
  });
  switch (key) {
    case "i":
      return move(faceMove("R", "r", oSr as 1 | 2, false));
    case "k":
      return move(faceMove("R", "r", oSr as 1 | 2, true));
    case "j":
      return move("U");
    case "f":
      return move("U'");
    case "h":
      return move("F");
    case "g":
      return move("F'");
    case "d":
      return move(faceMove("L", "l", oSl as 1 | 2, false));
    case "e":
      return move(faceMove("L", "l", oSl as 1 | 2, true));
    case "s":
      return move("D");
    case "l":
      return move("D'");
    case "w":
      return move("B");
    case "o":
      return move("B'");
    case "u":
      return move(oSr === 1 ? "r" : "x", oSr !== 1);
    case "r":
      return move(oSl === 1 ? "l'" : "x", oSl !== 1);
    case "m":
      return move(oSr === 1 ? "r'" : "x'", oSr !== 1);
    case "v":
      return move(oSl === 1 ? "l" : "x'", oSl !== 1);
    case ",":
      return move("u");
    case "c":
      return move("u'");
    case "z":
      return move("d");
    case "/":
      return move("d'");
    case ".":
    case "x":
      return move("M'");
    case "5":
    case "6":
      return move("M");
    case "1":
      return move("S'");
    case "0":
      return move("S");
    case "2":
      return move("E");
    case "9":
      return move("E'");
    case ";":
      return move("y", true);
    case "a":
      return move("y'", true);
    case "t":
    case "y":
      return move("x", true);
    case "n":
    case "b":
      return move("x'", true);
    case "p":
      return move("z", true);
    case "q":
      return move("z'", true);
    default:
      return null;
  }
}

export function facesUniform(state: string): boolean {
  if (state.length !== 54) return false;
  for (let face = 0; face < 6; face += 1) {
    const base = face * 9;
    const first = state[base];
    for (let i = 1; i < 9; i += 1) {
      if (state[base + i] !== first) return false;
    }
  }
  return true;
}

export { SOLVED_FAST_STATE };

export function inspectionPenalty(inspectionMs: number): "none" | "+2" | "DNF" {
  if (inspectionMs > 17_000) return "DNF";
  if (inspectionMs > 15_000) return "+2";
  return "none";
}
