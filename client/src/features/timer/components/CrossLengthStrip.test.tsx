import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import type { CrossLengths } from "@/lib/solverRuntime";
import { scrambledState } from "@/lib/scrambleOrientation";
import { CrossLengthStrip } from "./CrossLengthStrip";

const mocks = vi.hoisted(() => ({
  calls: [] as [string, string][],
  result: (): Promise<CrossLengths> => Promise.reject(new Error("unset")),
}));
vi.mock("@/lib/solverRuntime", () => ({
  crossLengthsInBrowser: (kind: string, value: string) => {
    mocks.calls.push([kind, value]);
    return mocks.result();
  },
}));

function renderStrip(scramble = "R U F") {
  return render(
    <LanguageProvider>
      <CrossLengthStrip scramble={scramble} />
    </LanguageProvider>
  );
}

describe("CrossLengthStrip", () => {
  beforeEach(() => {
    mocks.calls = [];
  });

  it("hiện số move của cả 6 màu và đánh dấu các màu tốt nhất", async () => {
    mocks.result = () => Promise.resolve({ U: 6, R: 5, F: 4, D: 7, L: 4, B: 6 });
    renderStrip();
    expect(mocks.calls).toEqual([["state", scrambledState("R U F")]]);
    await screen.findByText("7");
    const items = screen.getAllByRole("listitem");
    expect(items.map(item => item.textContent?.replace(/\D/g, ""))).toEqual([
      "7", "6", "4", "6", "5", "4",
    ]);
    expect(items.filter(item => item.dataset.best)).toHaveLength(2);
    expect(screen.queryByText(/tốt nhất|best/)).toBeNull();
  });

  it("ẩn đi khi bộ giải báo lỗi", async () => {
    mocks.result = () => Promise.reject(new Error("centers"));
    const { container } = renderStrip("Rw R");
    await vi.waitFor(() => expect(container.textContent).toBe(""));
  });
});
