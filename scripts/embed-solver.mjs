import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const solverRoot = join(here, "..", "..", "cfop_solver", "cfop_solver");
const target = join(here, "..", "client", "src", "lib", "embeddedSolver.ts");
const files = [
  "__init__.py",
  "cube.py",
  "notation.py",
  "validation.py",
  "predicates.py",
  "f2l_macros.py",
  "f2l_symmetry.py",
  "cross_table.py",
  "search.py",
  "phases.py",
  "solver.py",
  "full_database.py",
  "one_look_database.py",
  "full_last_layer.py",
];

const payload = Object.fromEntries(
  files.map((name) => [name, readFileSync(join(solverRoot, name), "utf8")]),
);

mkdirSync(dirname(target), { recursive: true });
writeFileSync(
  target,
  `/** Generated from the verified Python CFOP package. Do not hand-edit. */\nexport const PYTHON_SOLVER_FILES = ${JSON.stringify(payload, null, 2)} as const;\n`,
);
console.log(`Embedded ${files.length} Python modules into ${target}`);
