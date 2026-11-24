export const FACE_ORDER: Array<"U" | "R" | "F" | "D" | "L" | "B"> = [
  "U",
  "R",
  "F",
  "D",
  "L",
  "B",
];
export const FACE_OFFSET: Record<string, number> = {
  U: 0,
  R: 9,
  F: 18,
  D: 27,
  L: 36,
  B: 45,
};
const SLICE_MOVES: Record<string, { axis: "x" | "y" | "z"; layers: number[]; sign: 1 | -1 }> = {
  R: { axis: "x", layers: [1], sign: -1 },
  L: { axis: "x", layers: [-1], sign: 1 },
  r: { axis: "x", layers: [0, 1], sign: -1 },
  l: { axis: "x", layers: [-1, 0], sign: 1 },
  M: { axis: "x", layers: [0], sign: 1 },
  U: { axis: "y", layers: [1], sign: -1 },
  D: { axis: "y", layers: [-1], sign: 1 },
  u: { axis: "y", layers: [0, 1], sign: -1 },
  d: { axis: "y", layers: [-1, 0], sign: 1 },
  E: { axis: "y", layers: [0], sign: -1 },
  F: { axis: "z", layers: [1], sign: -1 },
  B: { axis: "z", layers: [-1], sign: 1 },
  f: { axis: "z", layers: [0, 1], sign: -1 },
  b: { axis: "z", layers: [-1, 0], sign: 1 },
  S: { axis: "z", layers: [0], sign: -1 },
  x: { axis: "x", layers: [-1, 0, 1], sign: -1 },
  y: { axis: "y", layers: [-1, 0, 1], sign: -1 },
  z: { axis: "z", layers: [-1, 0, 1], sign: -1 },
};
export const ORBIT_LIMIT = 1.1;
export const BODY = 0.66;
export const CELL_3 = 0.7;
export const CELL_2 = 0.95;

export function indexFor(face: string, x: number, y: number, z: number) {
  switch (face) {
    case "U":
      return FACE_OFFSET.U + (z + 1) * 3 + (x + 1);
    case "D":
      return FACE_OFFSET.D + (1 - z) * 3 + (x + 1);
    case "F":
      return FACE_OFFSET.F + (1 - y) * 3 + (x + 1);
    case "B":
      return FACE_OFFSET.B + (1 - y) * 3 + (1 - x);
    case "R":
      return FACE_OFFSET.R + (1 - y) * 3 + (1 - z);
    default:
      return FACE_OFFSET.L + (1 - y) * 3 + (z + 1);
  }
}

export function parseMove(move: string) {
  const match = /^([a-zA-Z])(['2]?)$/.exec(move.trim());
  if (!match) return null;
  const base = match[1];
  const suffix = match[2];
  const spec = SLICE_MOVES[base];
  if (!spec) return null;
  if (match[1].toLowerCase() === "x" || match[1].toLowerCase() === "y" || match[1].toLowerCase() === "z") {
    const lower = match[1].toLowerCase();
    if (base === lower) {
      const axis = lower as "x" | "y" | "z";
      const sign = match[1] === lower ? -1 : 1;
      const angle = (suffix === "2" ? Math.PI : (Math.PI / 2) * sign * (suffix === "'" ? -1 : 1)) as number;
      return { axis, layers: [-1, 0, 1], angle };
    }
  }
  let angle = (Math.PI / 2) * spec.sign;
  if (suffix === "'") angle = -angle;
  if (suffix === "2") angle *= 2;
  return { axis: spec.axis, layers: spec.layers, angle };
}


const WHOLE_CUBE_PERM: Record<string, number[]> = {
  x: [
    53, 52, 51, 50, 49, 48, 47, 46, 45, 11, 14, 17, 10, 13, 16, 9, 12, 15, 0, 1,
    2, 3, 4, 5, 6, 7, 8, 18, 19, 20, 21, 22, 23, 24, 25, 26, 42, 39, 36, 43, 40,
    37, 44, 41, 38, 35, 34, 33, 32, 31, 30, 29, 28, 27,
  ],
  "x'": [
    18, 19, 20, 21, 22, 23, 24, 25, 26, 15, 12, 9, 16, 13, 10, 17, 14, 11, 27,
    28, 29, 30, 31, 32, 33, 34, 35, 53, 52, 51, 50, 49, 48, 47, 46, 45, 38, 41,
    44, 37, 40, 43, 36, 39, 42, 8, 7, 6, 5, 4, 3, 2, 1, 0,
  ],
  x2: [
    27, 28, 29, 30, 31, 32, 33, 34, 35, 17, 16, 15, 14, 13, 12, 11, 10, 9, 53,
    52, 51, 50, 49, 48, 47, 46, 45, 0, 1, 2, 3, 4, 5, 6, 7, 8, 44, 43, 42, 41,
    40, 39, 38, 37, 36, 26, 25, 24, 23, 22, 21, 20, 19, 18,
  ],
  z: [
    11, 14, 17, 10, 13, 16, 9, 12, 15, 29, 32, 35, 28, 31, 34, 27, 30, 33, 20,
    23, 26, 19, 22, 25, 18, 21, 24, 38, 41, 44, 37, 40, 43, 36, 39, 42, 2, 5, 8,
    1, 4, 7, 0, 3, 6, 51, 48, 45, 52, 49, 46, 53, 50, 47,
  ],
  "z'": [
    42, 39, 36, 43, 40, 37, 44, 41, 38, 6, 3, 0, 7, 4, 1, 8, 5, 2, 24, 21, 18,
    25, 22, 19, 26, 23, 20, 15, 12, 9, 16, 13, 10, 17, 14, 11, 33, 30, 27, 34,
    31, 28, 35, 32, 29, 47, 50, 53, 46, 49, 52, 45, 48, 51,
  ],
};
const ALIGN_PERM_KEY: Record<string, keyof typeof WHOLE_CUBE_PERM | null> = {
  U: "z2",
  D: null,
  F: "x'",
  B: "x",
  R: "z",
  L: "z'",
};
WHOLE_CUBE_PERM.z2 = WHOLE_CUBE_PERM.z.map(index => WHOLE_CUBE_PERM.z[index]);
