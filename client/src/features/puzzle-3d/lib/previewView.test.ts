import { beforeEach, describe, expect, it } from "vitest";
import { PREVIEW_VIEW_KEY, readPreviewView, writePreviewView } from "./previewView";

describe("preview view", () => {
  beforeEach(() => window.localStorage.clear());

  it("defaults to 3D and remembers the last choice", () => {
    expect(readPreviewView()).toBe("3d");
    writePreviewView("2d");
    expect(window.localStorage.getItem(PREVIEW_VIEW_KEY)).toBe("2d");
    expect(readPreviewView()).toBe("2d");
    writePreviewView("3d");
    expect(readPreviewView()).toBe("3d");
  });

  it("ignores a value it does not know", () => {
    window.localStorage.setItem(PREVIEW_VIEW_KEY, "4d");
    expect(readPreviewView()).toBe("3d");
  });
});
