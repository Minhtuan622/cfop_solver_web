/**
 * Generates `client/src/features/cfop/lib/f2l4AnglesData.ts` from
 * `f2l-4angles.json`, which was parsed from https://cubingapp.com/algorithms/F2L
 * (the complete F2L set with all four slot angles: Front Right / Front Left /
 * Back Right / Back Left).
 *
 * Slot algs are anchored to the FR id (`F2L-01`, …) to keep existing SRS keys
 * valid; the other three slots carry the same id with a `-FL` / `-BR` / `-BL`
 * suffix. Rotation-bearing algs (e.g. `y' R U2 R' … y`) are kept as-is; the
 * whole-cube rotations cancel pairwise.
 *
 * Usage: node scripts/export-f2l-4-angles.mjs with a current
 * `f2l-4angles.json` in the repo root (re-parse the page to refresh).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const algs = JSON.parse(
  readFileSync(join(root, "f2l-4angles.json"), "utf8"),
);
const target = join(root, "client/src/features/cfop/lib/f2l4AnglesData.ts");

const SLOTS = [
  { key: "Front Right", group: "FR", idSuffix: "", nameSuffix: " · FR" },
  { key: "Front Left", group: "FL", idSuffix: "-FL", nameSuffix: " · FL" },
  { key: "Back Right", group: "BR", idSuffix: "-BR", nameSuffix: " · BR" },
  { key: "Back Left", group: "BL", idSuffix: "-BL", nameSuffix: " · BL" },
];

const rows = [];
for (const item of algs) {
  const num = String(item.num).padStart(2, "0");
  for (const slot of SLOTS) {
    rows.push({
      id: `F2L-${num}${slot.idSuffix}`,
      group: slot.group,
      algorithm: item[slot.key],
      num,
    });
  }
}

const literal = row =>
  `  { id: ${JSON.stringify(row.id)}, family: "f2l", group: ${JSON.stringify(
    row.group,
  )}, name: ${JSON.stringify(`F2L ${row.num}${row.group === "FR" ? "" : ` · ${row.group}`}`)}, algorithm: ${JSON.stringify(row.algorithm)} },`;

const output = `/**
 * Generated from https://cubingapp.com/algorithms/F2L — do not hand-edit.
 * F2L 4 slot angles (the 41 F2L cases performed in FR / FL / BR / BL),
 * with the algorithms as published on the source page.
 * Regenerate with: node scripts/export-f2l-4-angles.mjs
 */
import type { CfopCaseRow } from "./cfopCatalogData";

export const F2L_4ANGLES_ROWS: readonly CfopCaseRow[] = [
${rows.map(literal).join("\n")}
];
`;
writeFileSync(target, output);
console.log(`wrote ${target} (${rows.length} rows)`);
