import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Alg } from "cubing/alg";
import { CUBE_COLORS } from "../client/src/features/puzzle-3d/lib/cubeColors";
import {
  SARAH_INTERMEDIATE_CASES_SOURCE,
  SARAH_ADVANCED_CASES_SOURCE,
} from "../client/src/features/skewb/lib/skewbData";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const rad = (deg: number) => (deg * Math.PI) / 180;
const TAU_120 = (-2 * Math.PI) / 3;

type Vec = [number, number, number];

const CORNER_POS: readonly Vec[] = [
  [1, 1, 1], [-1, 1, 1], [1, 1, -1], [-1, 1, -1],
  [1, -1, 1], [-1, -1, 1], [1, -1, -1], [-1, -1, -1],
];
const CENTER_POS: readonly Vec[] = [
  [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], [1, 0, 0], [-1, 0, 0],
];
const CENTER_NAMES = ["U", "D", "F", "B", "R", "L"] as const;
type FaceName = (typeof CENTER_NAMES)[number];
const FACE_NORMAL: Record<FaceName, Vec> = {
  U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1], R: [1, 0, 0], L: [-1, 0, 0],
};
const FACE_ORDER: readonly FaceName[] = ["U", "F", "R", "B", "L", "D"];
const HOME_FACES = [
  ["U", "F", "R"], ["U", "F", "L"], ["U", "B", "R"], ["U", "B", "L"],
  ["D", "F", "R"], ["D", "F", "L"], ["D", "B", "R"], ["D", "B", "L"],
] as const;
const FACE_CORNERS: Record<FaceName, number[]> = {
  U: [0, 1, 2, 3], D: [4, 5, 6, 7], F: [0, 4, 1, 5], B: [2, 6, 3, 7], R: [0, 2, 4, 6], L: [1, 3, 5, 7],
};

const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const addVec = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scaleVec = (v: Vec, s: number): Vec => [v[0] * s, v[1] * s, v[2] * s];
const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const normVec = (v: Vec): Vec => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const nearestIdx = (list: readonly Vec[], v: Vec) => {
  let best = -1, bd = Infinity;
  for (let i = 0; i < list.length; i++) {
    const d = (v[0] - list[i][0]) ** 2 + (v[1] - list[i][1]) ** 2 + (v[2] - list[i][2]) ** 2;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
};
const rotAxis = (axis: Vec, angle: number): number[][] => {
  const [ux, uy, uz] = normVec(axis);
  const c = Math.cos(angle), s = Math.sin(angle), t = 1 - c;
  return [
    [t * ux * ux + c, t * ux * uy - s * uz, t * ux * uz + s * uy],
    [t * uy * ux + s * uz, t * uy * uy + c, t * uy * uz - s * ux],
    [t * uz * ux - s * uy, t * uz * uy + s * ux, t * uz * uz + c],
  ];
};
const applyMat = (M: number[][], v: Vec): Vec => [
  M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
  M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
  M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
];

const GRIP_AXES: Record<string, number> = { F: 0, U: 3, L: 5, R: 6, B: 7, D: 4, UL: 1, UR: 2 };
const WHOLE_CUBE: Record<string, { axis: Vec; angle: number }> = {
  x: { axis: [1, 0, 0], angle: rad(90) },
  y: { axis: [0, 1, 0], angle: -rad(90) },
  z: { axis: [0, 0, 1], angle: -rad(90) },
};

interface CornerPiece { home: number; pos: Vec; normals: Vec[] }
interface CenterPiece { home: number; pos: Vec; normal: Vec }
interface State { corners: CornerPiece[]; centers: CenterPiece[] }

const solvedState = (): State => ({
  corners: HOME_FACES.map((faces, i) => ({
    home: i,
    pos: [...CORNER_POS[i]] as Vec,
    normals: faces.map(f => [...FACE_NORMAL[f]] as Vec),
  })),
  centers: CENTER_NAMES.map((f, i) => ({
    home: i,
    pos: [...CENTER_POS[i]] as Vec,
    normal: [...FACE_NORMAL[f]] as Vec,
  })),
});

const layerOf = (axis: Vec) =>
  CORNER_POS.map((p, i) => (dot(p, axis) >= 0 ? i : -1)).filter(i => i >= 0);

const applyGrip = (state: State, gripIdx: number, angle: number) => {
  const axis = CORNER_POS[gripIdx];
  const M = rotAxis(axis, angle);
  const inLayer = new Set(layerOf(axis));
  for (const c of state.corners) {
    if (inLayer.has(nearestIdx(CORNER_POS, c.pos))) {
      c.pos = applyMat(M, c.pos);
      c.normals = c.normals.map(n => applyMat(M, n));
    }
  }
  for (const c of state.centers) {
    if (dot(c.pos, axis) > 0) {
      c.pos = applyMat(M, c.pos);
      c.normal = applyMat(M, c.normal);
    }
  }
};

const applyRotation = (state: State, axis: Vec, angle: number) => {
  const M = rotAxis(axis, angle);
  for (const c of state.corners) {
    c.pos = applyMat(M, c.pos);
    c.normals = c.normals.map(n => applyMat(M, n));
  }
  for (const c of state.centers) {
    c.pos = applyMat(M, c.pos);
    c.normal = applyMat(M, c.normal);
  }
};

const invertToken = (t: string) => (t.endsWith("'") ? t.slice(0, -1) : t + "'");
const tokenize = (alg: string): string[] => {
  let i = 0;
  const n = alg.length;
  const readSuffix = (): { count: number; prime: boolean } => {
    let suffix = "";
    while (i < n && /[0-9']/.test(alg[i])) { suffix += alg[i]; i++; }
    const m = /^([0-9]+)?('?)$/.exec(suffix);
    return { count: m?.[1] ? Number(m[1]) : 1, prime: m?.[2] === "'" };
  };
  const readGroup = (): string[] => {
    const toks: string[] = [];
    while (i < n) {
      const ch = alg[i];
      if (ch === "(") { i++; const inner = readGroup(); toks.push(...repeat(inner)); continue; }
      if (ch === ")") { i++; return toks; }
      if (/\s/.test(ch)) { i++; continue; }
      if (/[A-Za-z]/.test(ch)) {
        const start = i;
        while (i < n && /[A-Za-z]/.test(alg[i])) i++;
        const word = alg.slice(start, i);
        const { count, prime } = readSuffix();
        for (let k = 0; k < count; k++) toks.push(prime ? invertToken(word) : word);
        continue;
      }
      i++;
    }
    return toks;
  };
  const repeat = (inner: string[]): string[] => {
    const { count, prime } = readSuffix();
    const body = prime ? [...inner].reverse().map(invertToken) : inner;
    const rep: string[] = [];
    for (let k = 0; k < count; k++) rep.push(...body);
    return rep;
  };
  return readGroup();
};

const applyAlg = (state: State, alg: string) => {
  for (const tok of tokenize(alg)) {
    const prime = tok.endsWith("'");
    const base = prime ? tok.slice(0, -1) : tok;
    const dbl = base.endsWith("2");
    const bare = dbl ? base.slice(0, -1) : base;
    const whole = WHOLE_CUBE[bare];
    if (whole) {
      applyRotation(state, whole.axis, whole.angle * (dbl ? 2 : 1) * (prime ? -1 : 1));
      continue;
    }
    const gripIdx = GRIP_AXES[bare];
    if (gripIdx === undefined) throw new Error(`unknown token "${tok}"`);
    applyGrip(state, gripIdx, TAU_120 * (dbl ? 2 : 1) * (prime ? -1 : 1));
  }
};

const EL = rad(26);
const AZ = rad(34);
const eye = normVec([Math.sin(AZ) * Math.cos(EL), Math.sin(EL), Math.cos(AZ) * Math.cos(EL)]);
const xCam = normVec(cross([0, 1, 0], eye));
const yCam = cross(eye, xCam);
const project = (p: Vec): readonly [number, number] => [dot(p, xCam), dot(p, yCam)];

const faceFrame = (f: FaceName): { c: Vec; a: Vec; b: Vec } => {
  switch (f) {
    case "U": return { c: [0, 1, 0], a: [1, 0, 0], b: [0, 0, 1] };
    case "D": return { c: [0, -1, 0], a: [1, 0, 0], b: [0, 0, 1] };
    case "F": return { c: [0, 0, 1], a: [1, 0, 0], b: [0, 1, 0] };
    case "B": return { c: [0, 0, -1], a: [1, 0, 0], b: [0, 1, 0] };
    case "R": return { c: [1, 0, 0], a: [0, 0, 1], b: [0, 1, 0] };
    case "L": return { c: [-1, 0, 0], a: [0, 0, 1], b: [0, 1, 0] };
  }
};
const faceQuad = (f: FaceName): Vec[] => {
  const { c, a, b } = faceFrame(f);
  return [
    addVec(addVec(c, a), scaleVec(b, -1)),
    addVec(addVec(c, a), b),
    addVec(addVec(c, scaleVec(a, -1)), b),
    addVec(addVec(c, scaleVec(a, -1)), scaleVec(b, -1)),
  ];
};
const diamondQuad = (f: FaceName): Vec[] => {
  const { c, a, b } = faceFrame(f);
  return [addVec(c, a), addVec(c, b), addVec(c, scaleVec(a, -1)), addVec(c, scaleVec(b, -1))];
};
const triangleAt = (f: FaceName, cornerIdx: number): Vec[] => {
  const c = CORNER_POS[cornerIdx];
  const mids: Vec[] = [];
  for (const other of FACE_CORNERS[f]) {
    if (other === cornerIdx) continue;
    const o = CORNER_POS[other];
    const nDiff = [0, 1, 2].filter(k => Math.abs(c[k] - o[k]) > 0).length;
    if (nDiff === 1) mids.push(scaleVec(addVec(c, o), 0.5));
  }
  return [c, mids[0], mids[1]];
};

interface Sticker { pts: Vec[]; color: string; depth: number; centroid: Vec }
const makeSticker = (pts: Vec[], color: string): Sticker => {
  const centroid = scaleVec(pts.reduce(addVec, [0, 0, 0] as Vec), 1 / pts.length);
  return { pts, color, depth: dot(centroid, eye), centroid };
};

const collectStickers = (state: State, f: FaceName): Sticker[] => {
  const n = FACE_NORMAL[f];
  const stickers: Sticker[] = [];
  let bestCenter: CenterPiece | null = null;
  let bestD = -Infinity;
  for (const c of state.centers) {
    const d = dot(c.normal, n);
    if (d > bestD) { bestD = d; bestCenter = c; }
  }
  if (bestCenter) {
    stickers.push(makeSticker(diamondQuad(f), CUBE_COLORS[CENTER_NAMES[bestCenter.home]]));
  }
  for (const cornerIdx of FACE_CORNERS[f]) {
    const piece = state.corners.find(p => nearestIdx(CORNER_POS, p.pos) === cornerIdx)!;
    let bestIdx = -1, bd = -Infinity;
    for (let k = 0; k < 3; k++) {
      const d = dot(piece.normals[k], n);
      if (d > bd) { bd = d; bestIdx = k; }
    }
    stickers.push(makeSticker(triangleAt(f, cornerIdx), CUBE_COLORS[HOME_FACES[piece.home][bestIdx]]));
  }
  return stickers;
};

const VIEW_W = 300;
const VIEW_H = 300;
const MARGIN = 10;
const INSET = 0.78;

const render = (label: string, state: State) => {
  const visible = FACE_ORDER.filter(f => dot(FACE_NORMAL[f], eye) > 1e-6);
  const bodyPaths = visible.map(f => faceQuad(f).map(project));
  const stickers = visible
    .flatMap(f => collectStickers(state, f))
    .map(s => {
      const pts2 = s.pts.map(project);
      const ctr = [0, 0];
      for (const [x, y] of pts2) { ctr[0] += x / pts2.length; ctr[1] += y / pts2.length; }
      return { ...s, pts2, ctr };
    })
    .sort((a, b) => a.depth - b.depth);
  const xs = [...bodyPaths.flat(), ...stickers.flatMap(s => s.pts2)].map(p => p[0]);
  const ys = [...bodyPaths.flat(), ...stickers.flatMap(s => s.pts2)].map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = Math.min((VIEW_W - 2 * MARGIN) / (maxX - minX), (VIEW_H - 2 * MARGIN) / (maxY - minY));
  const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2;
  const t = (p: readonly [number, number]) =>
    `${((p[0] - midX) * scale + VIEW_W / 2).toFixed(2)},${(VIEW_H / 2 - (p[1] - midY) * scale).toFixed(2)}`;
  const pathOf = (pts: ReadonlyArray<readonly [number, number]>) =>
    `M${pts.map(p => { const [x, y] = t(p).split(","); return `${x} ${y}`; }).join("L")}Z`;
  const body = bodyPaths
    .map(pts => `<path d="${pathOf(pts)}" fill="#000000"/>`)
    .join("");
  const stickersOut = stickers
    .map(s => {
      const pts = s.pts2.map(p => [s.ctr[0] + (p[0] - s.ctr[0]) * INSET, s.ctr[1] + (p[1] - s.ctr[1]) * INSET] as const);
      return `<path d="${pathOf(pts)}" fill="${s.color}" stroke="#000000" stroke-width="2.4" stroke-linejoin="round"/>`;
    })
    .join("");
  return `<svg viewBox="0 0 ${VIEW_W} ${VIEW_H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label} case, Skewb"><!-- Drawn from the catalog algorithm with cubing.js (scripts/generate-skewb-diagrams.mts). Not cubingapp.com artwork. The #2a3048 tile matches the unsolved-tile tone used by the 2D lane previews so the black silhouette stays visible on both themes. --><rect x="0" y="0" width="${VIEW_W}" height="${VIEW_H}" rx="22" fill="#2a3048"/>${body}${stickersOut}</svg>\n`;
};

const cases = [...SARAH_INTERMEDIATE_CASES_SOURCE, ...SARAH_ADVANCED_CASES_SOURCE];
const outDir = join(ROOT, "client", "public", "diagrams", "skewb");
mkdirSync(outDir, { recursive: true });
for (const row of cases) {
  const inv = new Alg(row.algorithm).invert().toString();
  const state = solvedState();
  applyAlg(state, inv);
  writeFileSync(join(outDir, `${row.id}.svg`), render(row.name, state));
}
console.log(`wrote ${cases.length} skewb diagrams to ${outDir}`);
