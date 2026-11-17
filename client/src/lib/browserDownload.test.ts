import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadFile } from "./browserDownload";

describe("downloadFile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("creates an object URL, clicks an anchor and revokes the URL", () => {
    vi.useFakeTimers();
    const click = vi.fn();
    const createObjectURL = vi.fn(() => "blob:mock-url");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    const originalCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "a") {
        return { href: "", download: "", click } as unknown as HTMLAnchorElement;
      }
      return originalCreate(tagName);
    });

    downloadFile("report.csv", "text/csv;charset=utf-8", "content");

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(0);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });
});
