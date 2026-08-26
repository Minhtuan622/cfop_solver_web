// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import type { SolveHistoryEntry } from "@/lib/solveHistory";

vi.mock("@/components/Cube3DGuide", () => ({ Cube3DGuide: ({ move, step }: { move?: string; step: number }) => <div data-testid="cube-guide">{move ?? "ready"} · {step}</div> }));
vi.mock("@/components/CubeNet", () => ({ CubeNet: () => <div data-testid="cube-net" />, CUBE_COLOR: { U: "#fff", R: "#f00", F: "#0a0", D: "#ff0", L: "#f80", B: "#00f" } }));
vi.mock("@/components/SolveTimer", () => ({ SolveTimer: () => <div data-testid="solve-timer" /> }));
vi.mock("@/components/LastLayerStudyLab", () => ({ LastLayerStudyLab: () => <div data-testid="last-layer-study" /> }));
vi.mock("recharts", () => ({ Bar: () => null, BarChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>, Line: () => null, LineChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>, ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>, Tooltip: () => null, XAxis: () => null, YAxis: () => null }));
vi.mock("@/lib/timerEvents", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/timerEvents")>()), generateTimerScramble: async (eventId: string) => `${eventId} scramble` }));

import TimerLab from "./TimerLab";

const replayFixture: SolveHistoryEntry = {
  id: "replay-fixture",
  createdAt: 1_700_000_000_000,
  elapsedMs: 4_000,
  inspectionMs: 0,
  input: "R U",
  inputKind: "scramble",
  moves: 2,
  penalty: "none",
  solution: "U' R'",
  note: "Fixture replay only",
  tags: ["test"],
  phaseSplits: [],
};

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("Timer replay với solution đã lưu", () => {
  it("mở dialog, tạo trace hợp lệ và tiến từng move từ fixture cô lập", async () => {
    localStorage.setItem("cfop-language", "vi");
    localStorage.setItem("cfop-solve-history-v1", JSON.stringify([replayFixture]));

    render(<LanguageProvider><TimerLab /></LanguageProvider>);
    fireEvent.click(screen.getByRole("button", { name: /PB/ }));

    const replayAction = await screen.findByRole("button", { name: "Phát solution" });
    fireEvent.click(replayAction);

    expect(await screen.findByText("PHÁT LẠI SOLUTION THỰC TẾ")).toBeInTheDocument();
    expect(screen.getByText("U' R'")).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 2 · TPS/)).toBeInTheDocument();
    expect(screen.getAllByTestId("cube-guide").at(-1)).toHaveTextContent("ready · 0");

    fireEvent.click(screen.getByRole("button", { name: "Nước sau" }));
    await waitFor(() => expect(screen.getByText(/1 \/ 2 · TPS/)).toBeInTheDocument());
    expect(screen.getAllByTestId("cube-guide").at(-1)).toHaveTextContent("U' · 1");
  });

  it("tách event Timer, tạo scramble mới và tắt công cụ CFOP khi chọn puzzle khác 3×3", async () => {
    localStorage.setItem("cfop-language", "vi");
    render(<LanguageProvider><TimerLab /></LanguageProvider>);

    const eventSelect = screen.getByLabelText("Loại khối");
    fireEvent.change(eventSelect, { target: { value: "pyram" } });

    expect(await screen.findByText("pyram scramble")).toBeInTheDocument();
    expect(screen.getAllByText("Pyraminx").length).toBeGreaterThan(0);
    expect(screen.getByText(/Các công cụ CFOP\/3D chỉ áp dụng cho 3×3/i)).toBeInTheDocument();
    expect(screen.getByText("Chưa có solve Pyraminx.")).toBeInTheDocument();
  });
});
