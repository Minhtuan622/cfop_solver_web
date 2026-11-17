/**
 * Generates `client/src/features/last-layer/lib/directCaseCatalogData.ts`
 * from `solver-python/cfop_solver/one_look_database.py`.
 *
 * Each row is (case_id, Singmaster algorithm, inverse fixture facelets).
 * The generated module is checked in (like `fastCube.ts`), so the app can
 * browse the 1LLL/ZBLL direct-case catalog in pure JavaScript without the
 * Python/Pyodide runtime — this replaces the old lite worker's catalog
 * command. Re-run this after editing `one_look_database.py`:
 *
 *   node scripts/export-last-layer-catalog.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(
  join(root, "solver-python/cfop_solver/one_look_database.py"),
  "utf8"
);
const target = join(
  root,
  "client/src/features/last-layer/lib/directCaseCatalogData.ts"
);

/** Extract the (id, algorithm, state) tuples of a `NAME: tuple[...] = (…)` block. */
function tableOf(name) {
  const start = source.indexOf(`${name}:`);
  if (start < 0) throw new Error(`Table ${name} not found in one_look_database.py`);
  const open = source.indexOf("(", start);
  const closeMatch = /\n\)[ \t]*\r?\n/.exec(source.slice(open));
  if (open < 0 || !closeMatch)
    throw new Error(`Could not find the body of ${name}`);
  const body = source.slice(open + 1, open + closeMatch.index);
  const rows = [];
  for (const match of body.matchAll(
    /\('([^']+)',\s*"((?:[^"\\]|\\.)*)",\s*'([A-Z]{54})'\)/g
  )) {
    rows.push({ id: match[1], algorithm: match[2], state: match[3] });
  }
  if (!rows.length) throw new Error(`No rows parsed for ${name}`);
  return rows;
}

const oneLll = tableOf("ONE_LLL_DIRECT_CASES");
const zbll = tableOf("ZBLL_DIRECT_CASES");

const literal = row =>
  `  { id: ${JSON.stringify(row.id)}, algorithm: ${JSON.stringify(
    row.algorithm
  )}, state: ${JSON.stringify(row.state)} },`;

const output = `/**
 * Generated from solver-python/cfop_solver/one_look_database.py — do not hand-edit.
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
