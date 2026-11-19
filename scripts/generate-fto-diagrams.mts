/**
 * Generates the diagram for the 17 TCP "(2)" inverse-hold cases.
 *
 * The other 36 FTO case diagrams (the PF/TL/LT sets and the 18 base TCP
 * cases) are vendored CubeRoot artwork with attribution — see README.
 * The TCP "(2)" inverses are HCubist-only positions that CubeRoot does not
 * render, so they are drawn here from the sheet's own `caseState` instead.
 *
 * The FTO model (regular octahedron, faces at s·p = 1) is rebuilt offline in
 * `fto-model.mts` from the HCubist/Bencisco definition — no HCubist code is
 * embedded and this script runs fully offline.
 *
 * The camera reproduces the orientation CubeRoot uses for the vendored art:
 * the B face (green) lies flat on top and the U face (yellow) faces the
 * viewer dead-on, slightly above eye level so the lower tips peek out.
 *
 * Output: client/public/diagrams/fto2LookL3t/TCP-{A,B,C}*-2.svg
 * Run:    pnpm exec tsx --tsconfig tsconfig.json scripts/generate-fto-diagrams.mts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildFto } from "./fto-model.mts";
import { FTO_2_LOOK_L3T_CASES } from "../client/src/features/fto2LookL3t/lib/l2tData";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Same palette as the vendored CubeRoot artwork so the generated TCP (2)
// diagrams sit well next to the 36 vendored cases.
const COLORS = [
  "#deff26", // 0 yellow (U)
  "#2997fd", // 1 blue   (F)
  "#666666", // 2 grey   (R)
  "#ff9900", // 3 orange (L)
  "#0fcc09", // 4 green  (B)
  "#8830e3", // 5 purple (BL)
  "#d80f0f", // 6 red    (BR)
  "#ffffff", // 7 white  (D)
];

const { stickers, N } = buildFto();
const rad = (deg: number) => (deg * Math.PI) / 180;
const cross = (a: number[], b: number[]) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (v: number[]) => {
  const l = Math.hypot(...v) || 1;
  return v.map((x) => x / l);
};
const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const rodrigues = (v: number[], k: number[], angle: number) => {
  const c = Math.cos(angle), s = Math.sin(angle);
  const cx = cross(k, v);
  const kdot = dot(k, v);
  return [
    v[0] * c + cx[0] * s + k[0] * kdot * (1 - c),
    v[1] * c + cx[1] * s + k[1] * kdot * (1 - c),
    v[2] * c + cx[2] * s + k[2] * kdot * (1 - c),
  ];
};

// Rotate the puzzle so the B face is flat on top, then yaw until the U face
// points straight at the viewer — CubeRoot's exact hold for the vendored art.
const axisB = cross(N.B, [0, 1, 0]);
const angleB = Math.acos(dot(N.B, [0, 1, 0]));
const up = (v: number[]) => rodrigues(v, norm(axisB), angleB);
const preU = up(N.U);
const AZ = Math.atan2(preU[0], preU[2]);
const EL = rad(10);
const eye = norm([Math.sin(AZ) * Math.cos(EL), Math.sin(EL), Math.cos(AZ) * Math.cos(EL)]);
const xCam = norm(cross([0, 1, 0], eye));
const yCam = cross(eye, xCam);
const project = (p: number[]) => [dot(p, xCam), dot(p, yCam)] as const;

// Match the vendored CubeRoot canvas so every card shows the same framing.
const VIEW_W = 279.92;
const VIEW_H = 301.94;
const MARGIN = 8;

const render = (caseId: string, label: string, st: string) => {
  const cells = [];
  for (let i = 0; i < stickers.length; i++) {
    const s = stickers[i];
    const n = up(s.n);
    if (dot(n, eye) <= 1e-6) continue;
    const pts = s.poly.map((p) => project(up(p)));
    const c = up(s.c);
    const depth = dot(c, eye);
    const ctr = [0, 0];
    for (const [x, y] of pts) { ctr[0] += x / pts.length; ctr[1] += y / pts.length; }
    cells.push({ pts, depth, ctr, idx: i });
  }
  cells.sort((a, b) => a.depth - b.depth);

  const xs = cells.flatMap((c) => c.pts.map((p) => p[0]));
  const ys = cells.flatMap((c) => c.pts.map((p) => p[1]));
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = Math.min((VIEW_W - 2 * MARGIN) / (maxX - minX), (VIEW_H - 2 * MARGIN) / (maxY - minY));
  const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2;
  const t = (p: readonly [number, number]) =>
    [(((p[0] - midX) * scale) + VIEW_W / 2).toFixed(2), ((VIEW_H / 2) - ((p[1] - midY) * scale)).toFixed(2)].join(",");

  // Opaque black base pass: the union of the visible faces of a convex body
  // is exactly its silhouette, so this yields the smooth octahedron outline
  // with no halo spikes.
  const body = cells
    .map((c) => `<path d="M${c.pts.map((p) => t(p).replace(",", " ")).join("L")}Z" fill="#000000"/>`)
    .join("");
  const stickersSvg = cells
    .map((c) => {
      const fill = COLORS[Number(st[c.idx])] ?? "#ff00ff";
      const pts = c.pts.map((p) => [
        c.ctr[0] + (p[0] - c.ctr[0]) * 0.8,
        c.ctr[1] + (p[1] - c.ctr[1]) * 0.8,
      ] as const);
      return `<path d="M${pts.map((p) => t(p).replace(",", " ")).join("L")}Z" fill="${fill}" stroke="#000000" stroke-width="2.2" stroke-linejoin="round"/>`;
    })
    .join("");

  return `<svg viewBox="0 0 ${VIEW_W} ${VIEW_H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label} case, FTO"><!-- TCP "(2)" inverse-hold variant, drawn from the HCubist/Bencisco case state (scripts/generate-fto-diagrams.mts). Not CubeRoot artwork. -->${body}${stickersSvg}</svg>\n`;
};

// Only the TCP "(2)" inverse-hold variants are drawn by this script; every
// other FTO diagram in the repo is vendored CubeRoot artwork with attribution.
const isInverseVariant = (row: { id: string }) => /^TCP-[ABC]\d+-2$/.test(row.id);

for (const row of FTO_2_LOOK_L3T_CASES) {
  if (!isInverseVariant(row)) continue;
  const dir = join(ROOT, "client", "public", "diagrams", "fto2LookL3t");
  mkdirSync(dir, { recursive: true });
  const state = row.caseState;
  if (!state || state.length !== 72) {
    throw new Error(`${row.id} is missing a 72-character caseState (got ${state?.length ?? "none"}).`);
  }
  writeFileSync(join(dir, `${row.id}.svg`), render(row.id, row.name, state));
  console.log("wrote", join(dir, `${row.id}.svg`));
}
