// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render } from "@testing-library/react";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import type { SolveHistoryEntry } from "@/lib/solveHistory";

vi.mock("@/components/common/Cube3DGuide", () => ({ Cube3DGuide: ({ move, step }: { move?: string; step: number }) => <div data-testid="cube-guide">{move ?? "ready"} · {step}</div> }));
vi.mock("@/components/common/CubeNet", () => ({ CubeNet: () => <div data-testid="cube-net" />, CUBE_COLOR: { U: "#fff", R: "#f00", F: "#0a0", D: "#ff0", L: "#f80", B: "#00f" } }));
vi.mock("@/components/common/PuzzleScramblePreview", () => ({ PuzzleScramblePreview: ({ eventId }: { eventId: string }) => <div data-testid="puzzle-preview">{eventId} preview</div> }));
vi.mock("@/components/common/SolveTimer", async () => {
  const { useState } = await import("react");
  return { SolveTimer: ({ onComplete }: { onComplete: (completion: { elapsedMs: number; inspectionMs: number; automaticPenalty: "none"; phaseSplits: [] }) => void }) => { const [readout, setReadout] = useState("00:00.00"); return <button data-testid="solve-timer" onClick={() => { setReadout("00:30.00"); onComplete({ elapsedMs: 30_000, inspectionMs: 0, automaticPenalty: "none", phaseSplits: [] }); }}>{readout}</button>; } };
});
vi.mock("@/features/last-layerStudyLab", () => ({ LastLayerStudyLab: () => <div data-testid="last-layer-study" /> }));
vi.mock("recharts", () => ({ Bar: () => null, BarChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>, Line: () => null, LineChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>, ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>, Tooltip: () => null, XAxis: () => null, YAxis: () => null }));
vi.mock("@/lib/timerEvents", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/timerEvents")>()), generateTimerScramble: async (eventId: string) => `${eventId} scramble` }));
vi.mock("@/lib/trpc", () => ({ trpc: { cfopAccount: { me: { useQuery: () => ({ data: null, isLoading: false, isError: false }) }, wca: { profile: { useQuery: () => ({ data: null, isLoading: false, isError: false }) } } } } }));

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
  it("giữ kết quả vừa hoàn tất trên timer khi scramble kế tiếp được tạo", async () => {
    localStorage.setItem("cfop-language", "vi");
    render(<LanguageProvider><TimerLab /></LanguageProvider>);
    fireEvent.click(await screen.findByTestId("solve-timer"));
    await waitFor(() => expect(screen.getByTestId("solve-timer")).toHaveTextContent("00:30.00"));
    expect(screen.getByText("Đã lưu lượt vào nhật ký.")).toBeInTheDocument();
  });

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
    // Dropdown tự vẽ: bấm để mở danh sách rồi chọn mục.
    fireEvent.click(eventSelect);
    fireEvent.click(screen.getByRole("option", { name: "Pyraminx" }));

    expect(await screen.findByText("pyram scramble")).toBeInTheDocument();
    expect(screen.getAllByText("Pyraminx").length).toBeGreaterThan(0);
    expect(screen.getByTestId("puzzle-preview")).toHaveTextContent("pyram preview");
    expect(screen.queryByText(/Các công cụ CFOP\/3D chỉ áp dụng cho 3×3/i)).not.toBeInTheDocument();
    expect(screen.getByText("Chưa có solve Pyraminx.")).toBeInTheDocument();
    expect(screen.getByText("Liên kết WCA ID")).toBeInTheDocument();

    fireEvent.click(eventSelect);
    fireEvent.click(screen.getByRole("option", { name: "4×4×4" }));
    expect(await screen.findByText("444 scramble")).toBeInTheDocument();
    expect(screen.getByTestId("puzzle-preview")).toHaveTextContent("444 preview");
    expect(screen.getByText("Chưa có solve 4×4×4.")).toBeInTheDocument();

    fireEvent.click(eventSelect);
    fireEvent.click(screen.getByRole("option", { name: "3×3 BLD" }));
    expect(await screen.findByText("333bf scramble")).toBeInTheDocument();
    expect(screen.getAllByTestId("cube-guide").at(-1)).toHaveTextContent("ready · 0");
    expect(screen.getByText("Chưa có solve 3×3 BLD.")).toBeInTheDocument();
  });

  it("ghi điểm Multi-Blind từ số khối giải đúng và thời gian sau khi dừng timer", async () => {
    localStorage.setItem("cfop-language", "vi");
    render(<LanguageProvider><TimerLab /></LanguageProvider>);
    fireEvent.click(screen.getByLabelText("Loại khối"));
    fireEvent.click(screen.getByRole("option", { name: "3×3 MBLD" }));
    expect(await screen.findByText("2 SCRAMBLE RIÊNG · MỖI KHỐI MỘT SCRAMBLE")).toBeInTheDocument();
    expect(screen.queryByTestId("cube-guide")).not.toBeInTheDocument();
    expect(screen.getByText("Multi-Blind tập trung vào bộ scramble riêng cho từng khối.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Số khối thử Multi-Blind"), { target: { value: "4" } });
    expect(screen.getByText("Hãy tạo đủ một scramble riêng cho mỗi khối trước khi bắt đầu Multi-Blind.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tạo scramble Multi-Blind" }));
    expect(await screen.findByText("4 SCRAMBLE RIÊNG · MỖI KHỐI MỘT SCRAMBLE")).toBeInTheDocument();
    expect(screen.getAllByText("333 scramble")).toHaveLength(4);
    fireEvent.click(screen.getByTestId("solve-timer"));
    expect(await screen.findByText("Xác nhận kết quả Multi-Blind")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Số khối giải đúng Multi-Blind"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu điểm Multi-Blind" }));
    expect(await screen.findByText(/3\/4 · 2đ · 0:30/)).toBeInTheDocument();
  });
});
