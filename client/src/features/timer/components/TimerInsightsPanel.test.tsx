import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import type { SolveHistoryEntry } from "@/lib/solveHistory";
import { TimerInsightsPanel } from "./TimerInsightsPanel";

const entry = (id: number, ms: number): SolveHistoryEntry =>
  ({
    id: String(id),
    createdAt: Date.now() - id * 3_600_000,
    elapsedMs: ms,
    penalty: "none",
  }) as SolveHistoryEntry;

function renderPanel(entries: SolveHistoryEntry[]) {
  return render(
    <LanguageProvider>
      <TimerInsightsPanel entries={entries} />
    </LanguageProvider>
  );
}

describe("TimerInsightsPanel", () => {
  it("shows an empty state without solves", () => {
    renderPanel([]);
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByText(/solve/i)).toBeTruthy();
  });

  it("renders the heatmap, the sub-X picker and the comparison table", () => {
    renderPanel([entry(1, 9000), entry(2, 9500), entry(3, 11_200)]);
    expect(screen.getByRole("img")).toBeTruthy();
    expect(screen.getByRole("table")).toBeTruthy();
    const pills = screen.getAllByRole("button", { name: /Sub-/ });
    expect(pills.length).toBeGreaterThan(0);
    fireEvent.click(pills[pills.length - 1]);
    expect(pills[pills.length - 1].getAttribute("aria-pressed")).toBe("true");
  });
});
