// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { readStoredJson, readStoredValue, removeStoredValue, writeStoredValue } from "./browserStorage";

describe("browserStorage", () => {
  beforeEach(() => localStorage.clear());

  it("reads and writes primitive values without changing their keys", () => {
    expect(writeStoredValue("cfop-test", "value")).toBe(true);
    expect(readStoredValue("cfop-test")).toBe("value");
    expect(removeStoredValue("cfop-test")).toBe(true);
    expect(readStoredValue("cfop-test")).toBeNull();
  });

  it("returns the supplied fallback for absent or malformed JSON", () => {
    expect(readStoredJson("missing", { version: 1 })).toEqual({ version: 1 });
    localStorage.setItem("broken", "{");
    expect(readStoredJson("broken", [])).toEqual([]);
  });
});
