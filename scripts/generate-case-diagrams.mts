/**
 * Generates the flat case-diagram SVGs shown in the study catalog tiles for
 * the CFOP 3×3, 2×2 and Last Layer lanes — the same flat-ink language as the
 * 4×4 Parity / Pyraminx / Skewb / Square-1 diagrams.
 *
 * The diagrams are derived from the *verified* catalog data (the same
 * case-state strings the app derives for every case), so no external markup
 * is scraped and no diagram can drift from the case it documents. Coverage:
 *
 *   cfop       f2l → full 3×3 net · oll/pll/coll/ollcp → LL-only cross
 *   twoByTwo   cll/pbl/eg1/eg2 → full 2×2 net
 *   lastLayer  zbll/1lll → LL-only cross
 *
 * Output: client/public/diagrams/<lane>/<case-id>.svg
 * Run:    pnpm exec tsx --tsconfig tsconfig.json scripts/generate-case-diagrams.mts
 * The script is idempotent and fails loudly on duplicate ids or bad states.
 */
import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CUBE_COLORS } from "../client/src/features/puzzle-3d/lib/cubeColors";
import { listLastLayerDirectCases } from "../client/src/features/last-layer/lib/directCaseCatalog";
import { listTwoByTwoCases } from "../client/src/features/twoByTwo/lib/twoByTwoCatalog";
import { listCfopCases } from "../client/src/features/cfop/lib/cfopCatalog";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "client", "public", "diagrams");

const S = 30; // cell edge, px
const G = 5; // gap between cells, px
const RX = Math.round(S * 0.18); // corner radius, px

const UNKNOWN = "#6b7280";

type Cell = { col: number; row: number; fill: string };

const SOLVED =
  "U".repeat(9) + "R".repeat(9) + "F".repeat(9) + "D".repeat(9) + "L".repeat(9) + "B".repeat(9);

/** Stickers that did not move stay faint; the case pops against the ink stage. */
const DIM = "#2a3048";

function colorAt(solved: string) {
  return (state: string, index: number): string =>
    state[index] === solved[index]
      ? DIM
      : (CUBE_COLORS[state[index] ?? ""] ?? UNKNOWN);
}

function colorAll(state: string, index: number): string {
  return CUBE_COLORS[state[index] ?? ""] ?? UNKNOWN;
}

function net3Cells(state: string): Cell[] {
  // Unfolded net: U above F; L F R B in the middle row; D below F.
  const color = colorAt(SOLVED);
  const cells: Cell[] = [];
  const faceBlock = (offset: number, blockCol: number, blockRow: number) => {
    for (let i = 0; i < 9; i += 1) {
      const col = blockCol * 3 + (i % 3);
      const row = blockRow * 3 + Math.floor(i / 3);
      cells.push({ col, row, fill: color(state, offset + i) });
    }
  };
  faceBlock(0, 1, 0); // U
  faceBlock(36, 0, 1); // L
  faceBlock(18, 1, 1); // F
  faceBlock(9, 2, 1); // R
  faceBlock(45, 3, 1); // B
  faceBlock(27, 1, 2); // D
  return cells;
}

function llCells(state: string): Cell[] {
  // Classic last-layer cross: B top row / L U R rows / F bottom row.
  const cells: Cell[] = [];
  const at = (col: number, row: number, index: number) =>
    cells.push({ col, row, fill: colorAll(state, index) });
  for (let c = 0; c < 3; c += 1) at(1 + c, 0, 45 + c); // B top row
  for (let r = 0; r < 3; r += 1) {
    at(0, 1 + r, 36 + r * 3); // L left column
    for (let c = 0; c < 3; c += 1) at(1 + c, 1 + r, r * 3 + c); // U face
    at(4, 1 + r, 9 + r * 3); // R top row
  }
  for (let c = 0; c < 3; c += 1) at(1 + c, 4, 18 + c); // F top row
  return cells;
}

function net2Cells(state: string): Cell[] {
  // 2×2 unfolded net: U above F; L F R B middle; D below F.
  // Small enough that full colour stays readable.
  const cells: Cell[] = [];
  const faceBlock = (offset: number, blockCol: number, blockRow: number) => {
    for (let i = 0; i < 4; i += 1) {
      const col = blockCol * 2 + (i % 2);
      const row = blockRow * 2 + Math.floor(i / 2);
      cells.push({ col, row, fill: colorAll(state, offset + i) });
    }
  };
  faceBlock(0, 1, 0); // U
  faceBlock(16, 0, 1); // L
  faceBlock(8, 1, 1); // F
  faceBlock(4, 2, 1); // R
  faceBlock(20, 3, 1); // B
  faceBlock(12, 1, 2); // D
  return cells;
}

function renderSvg(cells: Cell[], cols: number, rows: number): string {
  const width = cols * S + (cols - 1) * G;
  const height = rows * S + (rows - 1) * G;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`,
  ];
  for (const { col, row, fill } of cells) {
    const x = col * (S + G);
    const y = row * (S + G);
    parts.push(
      `<rect x="${x}" y="${y}" width="${S}" height="${S}" rx="${RX}" fill="${fill}" />`,
    );
  }
  parts.push("</svg>");
  return parts.join("");
}

function assertValidState(id: string, state: string, size: 54 | 24) {
  if (typeof state !== "string" || state.length !== size) {
    throw new Error(`${id}: state must be ${size} chars, got ${state?.length}`);
  }
  if (!/^[URFDLB]+$/.test(state)) {
    throw new Error(`${id}: state contains unexpected stickers: ${state}`);
  }
}

function writeLane(
  lane: string,
  rows: ReadonlyArray<{ id: string; family: string; state: string }>,
  layout: (row: { family: string }) => { fn: (state: string) => Cell[]; cols: number; rows: number },
) {
  const seen = new Set<string>();
  let written = 0;
  for (const row of rows) {
    if (seen.has(row.id)) throw new Error(`duplicate id ${row.id}`);
    seen.add(row.id);
    const { fn, cols, rows: rowCount } = layout(row);
    const svg = renderSvg(fn(row.state), cols, rowCount);
    if (svg.includes("undefined")) throw new Error(`${row.id}: svg contains "undefined"`);
    const file = join(OUT, lane, `${encodeURIComponent(row.id)}.svg`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, svg, "utf8");
    written += 1;
  }
  return written;
}

function main() {
  const cfop = listCfopCases({ limit: 10000 }).map((row) => ({
    id: row.id,
    family: row.family,
    state: row.state,
  }));
  const twoByTwo = listTwoByTwoCases({ limit: 10000 }).map((row) => ({
    id: row.id,
    family: row.family,
    state: row.state,
  }));
  const lastLayer = listLastLayerDirectCases({ limit: 10000 }).map((row) => ({
    id: row.id,
    family: row.family,
    state: row.state,
  }));

  for (const row of cfop) assertValidState(row.id, row.state, 54);
  for (const row of twoByTwo) assertValidState(row.id, row.state, 24);
  for (const row of lastLayer) assertValidState(row.id, row.state, 54);

  const net3Spec = { fn: net3Cells, cols: 12, rows: 9 };
  const llSpec = { fn: llCells, cols: 5, rows: 5 };
  const net2Spec = { fn: net2Cells, cols: 8, rows: 6 };

  const cfopCount = writeLane("cfop", cfop, (row) =>
    row.family === "f2l" ? net3Spec : llSpec,
  );
  const twoByTwoCount = writeLane("twoByTwo", twoByTwo, () => net2Spec);
  const lastLayerCount = writeLane("lastLayer", lastLayer, () => llSpec);

  console.log(
    `generated cfop=${cfopCount} twoByTwo=${twoByTwoCount} lastLayer=${lastLayerCount} total=${
      cfopCount + twoByTwoCount + lastLayerCount
    }`,
  );
  // Spot check: a few known ids exist and are non-trivial.
  for (const [lane, id] of [
    ["cfop", "F2L-01"],
    ["cfop", "OLL-01"],
    ["twoByTwo", "CLL-AS-1"],
    ["twoByTwo", "EG1-AS-1"],
    ["lastLayer", "ZBLLAS-001"],
  ] as const) {
    const file = join(OUT, lane, `${encodeURIComponent(id)}.svg`);
    const size = statSync(file).size;
    if (size < 100) throw new Error(`${file} suspiciously small (${size} bytes)`);
    console.log(`ok ${lane}/${id}.svg (${size} bytes)`);
  }
}

main();
