/**
 * Generates `client/src/features/last-layer/lib/directCaseCatalogData.ts`
 * from the solver's one-look tables in
 * `packages/solver/cfop/src/one_look_data.rs`.
 *
 * Each row is (case_id, Singmaster algorithm, inverse fixture facelets). The
 * fixture is computed by the solver itself (WebAssembly build, see
 * `pnpm build:solver`): the inverse of the algorithm applied to a solved
 * cube. The generated module is checked in, so the app can browse the
 * 1LLL/ZBLL catalog in pure JavaScript. Re-run this after editing the tables:
 *
 *   pnpm build:solver && node scripts/export-last-layer-catalog.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(
  join(root, "packages/solver/cfop/src/one_look_data.rs"),
  "utf8"
);
const target = join(
  root,
  "client/src/features/last-layer/lib/directCaseCatalogData.ts"
);
const pkg = join(root, "packages/solver/solver-wasm/pkg");
const wasm = await import(join(pkg, "solver_wasm.js"));
wasm.initSync({ module: readFileSync(join(pkg, "solver_wasm_bg.wasm")) });

/** Inverse of a move sequence, in the solver's notation. */
function invert(algorithm) {
  return algorithm
    .replace(/[(),]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .reverse()
    .map(move => (move.endsWith("3") ? `${move.slice(0, -1)}'` : move))
    .map(move => {
      if (move.endsWith("2") || move.endsWith("2'")) return move.replace(/'$/, "");
      if (move.endsWith("'")) return move.slice(0, -1);
      return `${move}'`;
    })
    .join(" ");
}

/** Extract the (id, algorithm) rows of a `static NAME: [...] = [...]` table. */
function tableOf(name) {
  const start = source.indexOf(`static ${name}:`);
  if (start < 0) throw new Error(`Table ${name} not found in one_look_data.rs`);
  const end = source.indexOf("\n];", start);
  const rows = [];
  for (const match of source
    .slice(start, end)
    .matchAll(/\(\s*"((?:[^"\\]|\\.)*)",\s*"((?:[^"\\]|\\.)*)",?\s*\),/g)) {
    const [id, algorithm] = [JSON.parse(`"${match[1]}"`), JSON.parse(`"${match[2]}"`)];
    rows.push({ id, algorithm, state: wasm.scrambleToStickers(invert(algorithm)) });
  }
  if (!rows.length) throw new Error(`No rows parsed for ${name}`);
  return rows;
}

const oneLll = tableOf("ONE_LLL_CASES");
const zbll = tableOf("ZBLL_CASES");

const literal = row =>
  `  { id: ${JSON.stringify(row.id)}, algorithm: ${JSON.stringify(
    row.algorithm
  )}, state: ${JSON.stringify(row.state)} },`;

const output = `/**
 * Generated from packages/solver/cfop/src/one_look_data.rs — do not hand-edit.
 * Regenerate with: node scripts/export-last-layer-catalog.mjs
 *
 * Each row is (case_id, Singmaster algorithm, inverse fixture facelets).
 */

export type DirectCaseRow = { id: string; algorithm: string; state: string };

export const ONE_LLL_DIRECT_CASES: readonly DirectCaseRow[] = [
${oneLll.map(literal).join("\n")}
];

export const ZBLL_DIRECT_CASES: readonly DirectCaseRow[] = [
${zbll.map(literal).join("\n")}
];
`;

writeFileSync(target, output);
console.log(
  `wrote ${target} (${oneLll.length} 1LLL + ${zbll.length} ZBLL cases, ${(output.length / 1024).toFixed(1)} KB)`
);
