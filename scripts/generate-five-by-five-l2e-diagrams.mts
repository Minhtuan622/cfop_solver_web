/**
 * Generates the flat last-layer cross diagrams for the 5×5 L2E lane.
 *
 * The lane's 15 cases are edge-tredge cases: the only stickers that matter
 * are the U-face edges and the four side strips that touch them. The app's
 * practice card renders the inverse of each algorithm on the real 5×5
 * puzzle, so the diagrams are sampled from that exact same state instead of
 * being hand-drawn (the old catalog fell back to the grey L2E emblem).
 *
 * We use cubing.js's 5×5 KPuzzle for the state and the puzzle geometry's
 * solved SVG for the sticker layout + colours. The SVG gives every sticker
 * an `ORBIT-l<location>-o<orientation>` id and groups the stickers by face,
 * which is enough to recover the 5×5 face grids without hard-coding them.
 * The inverse algorithm is applied to the solved pattern, then each face's
 * top row is folded out into the classic 7×7-minus-corners last-layer cross.
 *
 * Corners are dimmed: L2E only concerns edge tredges, and the geometry's
 * sticker-orientation order for corners is not the KPuzzle's orientation
 * order (edge flips and centre colours are exact). The dim matches the
 * `DIM` used by the other flat diagrams, so it also blends into the dark
 * diagram stage used by `CaseDiagramImage`.
 *
 * Output: client/public/diagrams/fiveByFiveL2E/<case-id>.svg
 * Run:    pnpm exec tsx --tsconfig tsconfig.json scripts/generate-five-by-five-l2e-diagrams.mts
 */
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { KPattern } from "cubing/kpuzzle";
import { puzzles } from "cubing/puzzles";
import { CUBE_COLORS } from "../client/src/features/puzzle-3d/lib/cubeColors";
import { FIVE_BY_FIVE_L2E_CASES } from "../client/src/features/fiveByFiveL2E/lib/l2eData";
import { fiveByFiveL2EScrambleOf } from "../client/src/features/fiveByFiveL2E/lib/l2eAlg";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "client", "public", "diagrams", "fiveByFiveL2E");

const S = 30; // cell edge, px
const G = 5; // gap between cells, px
const RX = 5; // corner radius, px
const DIM = "#2a3048";

type FaceName = "U" | "B" | "F" | "L" | "R";
type SolvedFace = FaceName | "D";
type Sticker = {
  orbit: string;
  location: number;
  orientation: number;
  x: number;
  y: number;
};
type FaceGrid = string[][];
type Cell = { col: number; row: number; fill: string };

const FACES: FaceName[] = ["U", "B", "F", "L", "R"];

function parseSolvedSvg(svg: string) {
  const faces = new Map<FaceName, Sticker[]>();
  const solved = new Map<string, string>();
  const fillToFace = new Map<string, SolvedFace>();

  for (const group of svg.matchAll(/<g><title>([^<]+)<\/title>([\s\S]*?)<\/g>/g)) {
    const face = group[1] as SolvedFace;
    const stickers: Sticker[] = [];
    for (const match of group[2].matchAll(
      /<polygon id="([A-Z0-9]+)-l(\d+)-o(\d+)" class="sticker" style="fill: ([^"]+)" points="([^"]+)"/g,
    )) {
      const numbers = match[5]!.trim().split(/\s+/).map(Number);
      const x = Math.round(
        ((numbers[0]! + numbers[2]! + numbers[4]! + numbers[6]!) / 4) * 1000,
      ) / 1000;
      const y = Math.round(
        ((numbers[1]! + numbers[3]! + numbers[5]! + numbers[7]!) / 4) * 1000,
      ) / 1000;
      const sticker: Sticker = {
        orbit: match[1]!,
        location: Number(match[2]),
        orientation: Number(match[3]),
        x,
        y,
      };
      stickers.push(sticker);
      solved.set(
        `${sticker.orbit}:${sticker.location}:${sticker.orientation}`,
        match[4]!,
      );
      fillToFace.set(match[4]!, face);
    }
    // The D face never appears in the cross, but its stickers still define
    // the solved colour of every tredge whose second sticker is on D.
    if (FACES.includes(face as FaceName)) {
      faces.set(face as FaceName, stickers);
    }
  }

  if (faces.size !== FACES.length) {
    throw new Error(`expected ${FACES.length} faces in the solved SVG`);
  }
  return { faces, solved, fillToFace };
}

function faceGrid(
  pattern: KPattern,
  face: FaceName,
  layout: ReturnType<typeof parseSolvedSvg>,
  orbitSizes: Map<string, number>,
): FaceGrid {
  const stickers = layout.faces.get(face);
  if (!stickers) throw new Error(`missing ${face} face`);
  const xs = [...new Set(stickers.map(sticker => sticker.x))].sort(
    (a, b) => a - b,
  );
  const ys = [...new Set(stickers.map(sticker => sticker.y))].sort(
    (a, b) => a - b,
  );
  if (xs.length !== 5 || ys.length !== 5) {
    throw new Error(`${face}: expected a 5×5 sticker grid`);
  }

  const grid: FaceGrid = Array.from({ length: 5 }, () =>
    Array<string>(5).fill(""),
  );
  const seen = new Set<string>();
  for (const sticker of stickers) {
    const key = `${sticker.x},${sticker.y}`;
    if (seen.has(key)) continue; // fixed centres draw all four orientations
    seen.add(key);

    const orbit = pattern.patternData[sticker.orbit];
    if (!orbit) throw new Error(`missing orbit ${sticker.orbit}`);
    const orientations = orbitSizes.get(sticker.orbit);
    if (!orientations) throw new Error(`missing orbit size ${sticker.orbit}`);
    const orientation =
      (sticker.orientation + orbit.orientation[sticker.location]!) %
      orientations;
    const fill = layout.solved.get(
      `${sticker.orbit}:${orbit.pieces[sticker.location]}:${orientation}`,
    );
    const colorFace = fill ? layout.fillToFace.get(fill) : undefined;
    if (!colorFace) {
      throw new Error(
        `${face}: no solved colour for ${sticker.orbit}:${orbit.pieces[sticker.location]}:${orientation}`,
      );
    }
    grid[ys.indexOf(sticker.y)]![xs.indexOf(sticker.x)] = colorFace;
  }

  return grid;
}

function lastLayerCross(
  pattern: KPattern,
  layout: ReturnType<typeof parseSolvedSvg>,
  orbitSizes: Map<string, number>,
): Cell[] {
  const grids = new Map<FaceName, FaceGrid>();
  for (const face of FACES) {
    grids.set(face, faceGrid(pattern, face, layout, orbitSizes));
  }
  const U = grids.get("U")!;
  const B = grids.get("B")!;
  const F = grids.get("F")!;
  const L = grids.get("L")!;
  const R = grids.get("R")!;

  const cells: Cell[] = [];
  const push = (col: number, row: number, face: string, corner = false) => {
    cells.push({
      col,
      row,
      fill: corner ? DIM : (CUBE_COLORS[face] ?? DIM),
    });
  };

  // U face in the centre; the four U corners are irrelevant to L2E.
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const corner =
        (row === 0 || row === 4) && (col === 0 || col === 4);
      push(1 + col, 1 + row, U[row]![col]!, corner);
    }
  }

  // Top strip = B's top row, reversed when folded above U.
  // Bottom strip = F's top row, left-to-right.
  // Left/right strips = L/R top rows, with the right one reversed.
  for (let index = 0; index < 5; index += 1) {
    const topCorner = index === 0 || index === 4;
    push(1 + index, 0, B[0]![4 - index]!, topCorner);
    push(1 + index, 6, F[0]![index]!, topCorner);
    push(0, 1 + index, L[0]![index]!, topCorner);
    push(6, 1 + index, R[0]![4 - index]!, topCorner);
  }

  return cells;
}

function renderSvg(cells: Cell[]) {
  const width = 7 * S + 6 * G;
  const height = 7 * S + 6 * G;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`,
  ];
  for (const { col, row, fill } of cells) {
    parts.push(
      `<rect x="${col * (S + G)}" y="${row * (S + G)}" width="${S}" height="${S}" rx="${RX}" fill="${fill}" />`,
    );
  }
  parts.push("</svg>");
  return parts.join("");
}

async function main() {
  const loader = puzzles["5x5x5"];
  const [kpuzzle, solvedSvg] = await Promise.all([
    loader.kpuzzle(),
    loader.svg(),
  ]);
  const layout = parseSolvedSvg(solvedSvg);
  const orbitSizes = new Map(
    kpuzzle.definition.orbits.map(orbit => [
      orbit.orbitName,
      orbit.numOrientations,
    ]),
  );

  mkdirSync(OUT, { recursive: true });
  const seen = new Set<string>();
  for (const row of FIVE_BY_FIVE_L2E_CASES) {
    if (seen.has(row.id)) throw new Error(`duplicate id ${row.id}`);
    seen.add(row.id);

    const scramble = fiveByFiveL2EScrambleOf(row.algorithm);
    const pattern = kpuzzle.defaultPattern().applyAlg(scramble);
    const svg = renderSvg(lastLayerCross(pattern, layout, orbitSizes));
    if (svg.includes("undefined")) {
      throw new Error(`${row.id}: svg contains "undefined"`);
    }

    const file = join(OUT, `${encodeURIComponent(row.id)}.svg`);
    writeFileSync(file, svg, "utf8");
    if (statSync(file).size < 100) {
      throw new Error(`${file} suspiciously small`);
    }
  }

  console.log(`generated fiveByFiveL2E=${seen.size} diagrams in ${OUT}`);
}

void main();
