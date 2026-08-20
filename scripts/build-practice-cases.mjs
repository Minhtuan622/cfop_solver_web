import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "..", "..", "cfop_solver", "cfop_solver", "full_database.py");
const output = join(here, "..", "client", "src", "lib", "practiceCases.ts");
const text = readFileSync(source, "utf8");

function readBlock(name) {
  const start = text.indexOf(`${name} = [`);
  const end = text.indexOf("]\n", start);
  const block = text.slice(start, end);
  const rows = [];
  const row = /^\s*\((.+?),\s*(.+?),\s*(.+?)\),$/gm;
  for (const match of block.matchAll(row)) {
    const parse = (value) => Function(`return ${value}`)();
    rows.push({ id: String(parse(match[1])), group: String(parse(match[2])), algorithm: String(parse(match[3])) });
  }
  return rows;
}

const oll = readBlock("OLL_ALGORITHMS");
const pll = readBlock("PLL_ALGORITHMS");
if (oll.length !== 57 || pll.length !== 21) throw new Error(`Expected 57/21; got ${oll.length}/${pll.length}`);

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `/** Generated from verified full_database.py. */\nexport type PracticeCase = { id: string; group: string; algorithm: string; kind: \"OLL\" | \"PLL\" };\nexport const OLL_CASES: PracticeCase[] = ${JSON.stringify(oll.map((item) => ({ ...item, kind: "OLL" })), null, 2)};\nexport const PLL_CASES: PracticeCase[] = ${JSON.stringify(pll.map((item) => ({ ...item, kind: "PLL" })), null, 2)};\n`);
console.log(`Generated ${oll.length} OLL and ${pll.length} PLL practice cases.`);
