import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import History from "./History";

const entries = [
  { id: "three", createdAt: 1_700_000_000_000, eventId: "333", input: "R U R' U'", inputKind: "scramble" as const, elapsedMs: 12_340, inspectionMs: 0, penalty: "none" as const, solution: "", moves: 0, note: "", tags: [] },
  { id: "fto", createdAt: 1_700_000_010_000, eventId: "fto", input: "U R F'", inputKind: "scramble" as const, elapsedMs: 18_760, inspectionMs: 0, penalty: "none" as const, solution: "", moves: 0, note: "", tags: [] },
];

vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ language: "vi" }) }));
vi.mock("@/components/MoveComposer", () => ({ MoveComposer: () => null }));
vi.mock("@/components/BootstrapDialog", () => ({ Dialog: ({ children }: { children: React.ReactNode }) => <>{children}</>, DialogContent: ({ children }: { children: React.ReactNode }) => <>{children}</>, DialogDescription: ({ children }: { children: React.ReactNode }) => <>{children}</>, DialogFooter: ({ children }: { children: React.ReactNode }) => <>{children}</>, DialogHeader: ({ children }: { children: React.ReactNode }) => <>{children}</>, DialogTitle: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("recharts", () => ({ Line: () => null, LineChart: ({ children }: { children: React.ReactNode }) => <>{children}</>, ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>, Tooltip: () => null, XAxis: () => null, YAxis: () => null }));
vi.mock("@/lib/fastCube", () => ({ SOLVED_FAST_STATE: "", stateFromScramble: () => "", validateRecordedSolution: () => ({ valid: true, normalized: "", moves: [] }) }));
vi.mock("@/lib/timerEvents", () => ({ TIMER_EVENTS: [{ id: "333", labelVi: "3×3×3" }, { id: "fto", labelVi: "FTO" }], isThreeByThreeEvent: () => true, normalizeTimerEventId: (id: string | undefined) => id === "fto" ? "fto" : "333", timerEventLabel: (id: string) => id === "fto" ? "FTO" : "3×3×3" }));
vi.mock("@/lib/solveHistory", () => ({ readSolveHistory: () => entries, effectiveTime: (entry: { elapsedMs: number; penalty: string }) => entry.penalty === "DNF" ? null : entry.elapsedMs, exportSolveHistory: () => entries, importSolveHistory: () => entries, formatSolveResult: (entry: { elapsedMs: number }) => `${entry.elapsedMs / 1000}s`, formatSolveTime: (value: number) => `${value / 1000}s`, updateSolveHistory: () => entries, deleteSolveHistory: () => entries, deleteSolveHistoryMany: () => entries }));

describe("History theo loại Rubik", () => {
  it("labels every solve and filters the mixed history by event", () => {
    render(<History />);

    expect(screen.getByText("R U R' U'")).toBeTruthy();
    expect(screen.getByText("U R F'")).toBeTruthy();
    expect(screen.getAllByText("3×3×3").length).toBeGreaterThan(1);
    expect(screen.getAllByText("FTO").length).toBeGreaterThan(1);

    fireEvent.change(screen.getByLabelText("Loại Rubik"), { target: { value: "fto" } });
    expect(screen.queryByText("R U R' U'")).toBeNull();
    expect(screen.getByText("U R F'")).toBeTruthy();
  });
});
