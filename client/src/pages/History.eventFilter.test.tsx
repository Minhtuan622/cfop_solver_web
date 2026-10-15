import { render } from "@testing-library/react";
import { fireEvent, screen } from "@testing-library/dom";
import { describe, expect, it, vi } from "vitest";
import History from "./History";

const entries = [
  { id: "three", createdAt: 1_700_000_000_000, eventId: "333", input: "R U R' U'", inputKind: "scramble" as const, elapsedMs: 12_340, inspectionMs: 0, penalty: "none" as const, solution: "", moves: 0, note: "", tags: [] },
  { id: "fto", createdAt: 1_700_000_010_000, eventId: "fto", input: "U R F'", inputKind: "scramble" as const, elapsedMs: 18_760, inspectionMs: 0, penalty: "none" as const, solution: "", moves: 0, note: "", tags: [] },
  { id: "three-oh", createdAt: 1_700_000_020_000, eventId: "333oh", input: "R U", inputKind: "scramble" as const, elapsedMs: 15_000, inspectionMs: 0, penalty: "none" as const, solution: "", moves: 0, note: "", tags: [] },
];

vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ language: "vi" }) }));
vi.mock("@/components/common/MoveComposer", () => ({ MoveComposer: ({ label }: { label: string }) => <div>{label}</div> }));
vi.mock("@/components/ui/BootstrapDialog", () => ({ Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) => open ? <>{children}</> : null, DialogContent: ({ children }: { children: React.ReactNode }) => <>{children}</>, DialogDescription: ({ children }: { children: React.ReactNode }) => <>{children}</>, DialogFooter: ({ children }: { children: React.ReactNode }) => <>{children}</>, DialogHeader: ({ children }: { children: React.ReactNode }) => <>{children}</>, DialogTitle: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("recharts", () => ({ Line: () => null, LineChart: ({ children }: { children: React.ReactNode }) => <>{children}</>, ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>, Tooltip: () => null, XAxis: () => null, YAxis: () => null }));
vi.mock("@/lib/fastCube", () => ({ SOLVED_FAST_STATE: "", stateFromScramble: () => "", validateRecordedSolution: () => ({ valid: true, normalized: "", moves: [] }) }));
vi.mock("@/lib/timerEvents", () => ({ TIMER_EVENTS: [{ id: "333", labelVi: "3×3×3" }, { id: "333oh", labelVi: "3×3 OH" }, { id: "fto", labelVi: "FTO" }], normalizeTimerEventId: (id: string | undefined) => id === "fto" ? "fto" : id === "333oh" ? "333oh" : "333", timerEventLabel: (id: string) => id === "fto" ? "FTO" : id === "333oh" ? "3×3 OH" : "3×3×3" }));
vi.mock("@/lib/solveHistory", () => ({ readSolveHistory: () => entries, effectiveTime: (entry: { elapsedMs: number; penalty: string }) => entry.penalty === "DNF" ? null : entry.elapsedMs, exportSolveHistory: () => entries, importSolveHistory: () => entries, formatSolveResult: (entry: { elapsedMs: number }) => `${entry.elapsedMs / 1000}s`, formatSolveTime: (value: number) => `${value / 1000}s`, updateSolveHistory: () => entries, deleteSolveHistory: () => entries, deleteSolveHistoryMany: () => entries }));

describe("History theo loại Rubik", () => {
  it("labels every solve and filters the mixed history by event", () => {
    render(<History />);

    expect(screen.getByText("R U R' U'")).toBeTruthy();
    expect(screen.getByText("U R F'")).toBeTruthy();
    expect(screen.getAllByText("3×3×3").length).toBeGreaterThan(1);
    expect(screen.getAllByText("FTO").length).toBeGreaterThan(1);

    fireEvent.change(screen.getByLabelText("Loại Rubik"), { target: { value: "fto" } });
    expect(screen.queryByText("R U R' U'")) .toBeNull();
    expect(screen.getByText("U R F'")) .toBeTruthy();
  });

  it("only shows the solution editor for the exact 3×3×3 event, including in All mode", () => {
    render(<History />);
    fireEvent.change(screen.getByLabelText("Loại Rubik"), { target: { value: "all" } });

    const editButtons = screen.getAllByLabelText("Chỉnh sửa solve");
    fireEvent.click(editButtons[0]);
    expect(screen.getByText("Solution thực tế")).toBeTruthy();
    fireEvent.click(screen.getByText("Hủy"));

    fireEvent.click(screen.getAllByLabelText("Chỉnh sửa solve")[2]);
    expect(screen.queryByText("Solution thực tế")).toBeNull();
  });
});
