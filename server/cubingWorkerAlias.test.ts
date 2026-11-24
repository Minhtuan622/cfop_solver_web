import { describe, expect, it } from "vitest";
import { cubingWorkerAliasPlugin } from "../vite.config";

type Emitted = { type: string; fileName: string; source: string };

function run(bundle: Record<string, unknown>) {
  const emitted: Emitted[] = [];
  const plugin = cubingWorkerAliasPlugin();
  const hook = plugin.generateBundle as unknown as {
    order: string;
    handler: (
      this: { emitFile: (file: Emitted) => void },
      options: unknown,
      bundle: Record<string, unknown>
    ) => void;
  };
  expect(hook.order).toBe("post");
  hook.handler.call({ emitFile: file => emitted.push(file) }, {}, bundle);
  return emitted;
}

describe("cubing worker alias", () => {
  it("emits the un-hashed worker entry that cubing resolves at run time", () => {
    const emitted = run({
      "assets/search-worker-entry-w2-DZOj3pv2.js": {
        type: "chunk",
        fileName: "assets/search-worker-entry-w2-DZOj3pv2.js",
        code: 'import "./chunk-ABC.js";',
      },
      "assets/other-abc.js": { type: "chunk", fileName: "assets/other-abc.js", code: "" },
    });
    expect(emitted).toEqual([
      {
        type: "asset",
        fileName: "assets/search-worker-entry.js",
        source: 'import "./chunk-ABC.js";',
      },
    ]);
  });

  it("does nothing when the bundle has no worker entry", () => {
    expect(run({ "assets/a.js": { type: "chunk", fileName: "assets/a.js", code: "" } })).toEqual([]);
  });
});
