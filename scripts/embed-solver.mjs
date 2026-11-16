import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const solverRoot = join(here, "..", "solver-python", "cfop_solver");
const target = join(here, "..", "client", "src", "lib", "embeddedSolver.ts");
const files = [
  "__init__.py",
  "cube.py",
  "notation.py",
  "validation.py",
  "bld.py",
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
  files.map((name) => [
    name,
    // Chuẩn hoá CRLF -> LF trước khi nhúng. File .py trong checkout Windows có
    // CRLF (core.autocrlf) còn trên Linux là LF; nhúng thô sẽ khiến bundle
    // khác nhau giữa các OS và bước "Embed solver and verify no drift" trong CI
    // luôn đỏ khi bundle được sinh trên Windows.
    readFileSync(join(solverRoot, name), "utf8").replace(/\r\n/g, "\n"),
  ]),
);

mkdirSync(dirname(target), { recursive: true });
writeFileSync(
  target,
  `/** Generated from the verified Python CFOP package. Do not hand-edit. */\nexport const PYTHON_SOLVER_FILES = ${JSON.stringify(payload, null, 2)} as const;\n`,
);
console.log(`Embedded ${files.length} Python modules into ${target}`);
