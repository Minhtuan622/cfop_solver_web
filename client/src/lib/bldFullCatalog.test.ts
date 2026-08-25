import { afterEach, describe, expect, it, vi } from "vitest";
import { loadFullBldCatalog } from "./bldFullCatalog";

describe("full BLD catalog adapter", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("retains every algorithm variant while grouping edge, corner and special cases", async () => {
    const payloads = [
      { ACE: [[["R U", "F R"]], [["U R"]]] },
      { ADM: [[["L D L' U'"]]] },
      { ACAD: [[["R U R'", "U R U'"]]] },
      { BD: ["M U M'", "S U S'"] },
      { BEH: ["R U R'", "L U L'"] },
    ];
    let cursor = 0;
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => payloads[cursor++] })));
    const catalog = await loadFullBldCatalog();
    expect(catalog).toHaveLength(5);
    expect(catalog.find((entry) => entry.key === "ACE")?.algorithms).toEqual(["R U", "F R", "U R"]);
    expect(catalog.find((entry) => entry.key === "BD")?.kind).toBe("flip");
    expect(catalog.find((entry) => entry.key === "BEH")?.kind).toBe("twist");
  });
});
