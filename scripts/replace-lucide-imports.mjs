import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../client/src/", import.meta.url);

async function visit(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, item.name);
    if (item.isDirectory()) {
      await visit(path);
      continue;
    }
    if (!path.endsWith(".tsx") && !path.endsWith(".ts")) continue;
    const source = await readFile(path, "utf8");
    const next = source.replaceAll('from "lucide-react"', 'from "@/components/BootstrapIcon"');
    if (next !== source) await writeFile(path, next);
  }
}

await visit(root.pathname);
