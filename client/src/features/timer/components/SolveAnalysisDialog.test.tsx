// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SolveHistoryEntry } from "@/lib/solveHistory";

vi.mock("@/contexts/LanguageContext", async () => {
  const { translate } = await import("@/lib/i18n");
  return {
    useLanguage: () => ({
      language: "vi" as const,
      t: (key: string, params?: Record<string, string | number>) => translate("vi", key, params),
    }),
  };
});
// Khối 3D cần WebGL nên thay bằng khung rỗng; bộ phát và nhịp vẫn là mã thật.
vi.mock("@/features/puzzle-solver", () => ({
  SolutionStage: () => <div data-testid="stage" />,
}));
vi.mock("wouter", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
const compare = vi.fn();
vi.mock("../lib/solverComparison", () => ({ compareWithSolver: (...args: unknown[]) => compare(...args) }));

import { SolveAnalysisDialog } from "./SolveAnalysisDialog";

// Lời giải một OLL + PLL ngắn: scramble là nghịch đảo của lời giải.
const SOLUTION = "R U R' U R U2 R'";
const entry = (overrides: Partial<SolveHistoryEntry> = {}): SolveHistoryEntry => ({
  id: "a",
  createdAt: 1,
  elapsedMs: 3_000,
  inspectionMs: 0,
  input: "R U2 R' U' R U' R'",
  inputKind: "scramble",
  moves: 7,
  penalty: "none",
  solution: SOLUTION,
  moveTimes: [0, 150, 300, 450, 2_000, 2_150, 3_000],
  note: "",
  tags: [],
  phaseSplits: [
    { phase: "Cross", markedAtMs: 0, elapsedMs: 0 },
    { phase: "F2L", markedAtMs: 0, elapsedMs: 0 },
    { phase: "OLL", markedAtMs: 3_000, elapsedMs: 3_000 },
    { phase: "PLL", markedAtMs: 3_000, elapsedMs: 0 },
  ],
  eventId: "333",
  source: "smartcube",
  ...overrides,
});

afterEach(() => {
  cleanup();
  compare.mockReset();
});

describe("SolveAnalysisDialog", () => {
  it("hiện bảng giai đoạn, quãng dừng và case", async () => {
    render(<SolveAnalysisDialog entry={entry()} onClose={() => undefined} />);
    const table = await screen.findByTestId("analysis-phases");
    // OLL giữ cả 7 nước (HTM 7 vì R U R' U R U2 R' không gộp được).
    const oll = within(table).getByText("OLL").closest("tr")!;
    expect(within(oll).getAllByRole("cell")[1].textContent).toBe("7");
    // Quãng dừng 1,55 s trước nước thứ 5 là dài nhất.
    const pauses = await screen.findByTestId("analysis-pauses");
    expect(within(pauses).getByText("1.55s")).toBeTruthy();
    // Case: sau khi nạp danh mục, OLL không còn "Đang tải…".
    await waitFor(() => expect(screen.queryByText("Đang tải…")).toBeNull(), { timeout: 10_000 });
    // Sune (R U R' U R U2 R') nên case OLL là Sune/Anti-Sune, kèm liên kết luyện case.
    const link = (await screen.findAllByRole("link", { name: "Luyện case" }))[0];
    expect(link.getAttribute("href")).toMatch(/^\/study\?lane=cfop&case=OLL-(26|27)$/);
  });

  it("so với bộ giải bằng bộ giải thật khi bấm nút", async () => {
    compare.mockResolvedValue({ phases: { Cross: 0, F2L: 0, OLL: 5, PLL: 0 }, total: 5 });
    render(<SolveAnalysisDialog entry={entry()} onClose={() => undefined} />);
    fireEvent.click(await screen.findByRole("button", { name: "So với bộ giải" }));
    const table = await screen.findByTestId("analysis-comparison");
    expect(compare).toHaveBeenCalledWith("R U2 R' U' R U' R'");
    const total = within(table).getByText("Tổng").closest("tr")!;
    expect(Array.from(within(total).getAllByRole("cell")).map(cell => cell.textContent)).toEqual(["Tổng", "7", "5", "+2"]);
  });

  it("báo lỗi dễ hiểu khi bộ giải không chạy được", async () => {
    compare.mockRejectedValue(new Error("boom"));
    render(<SolveAnalysisDialog entry={entry()} onClose={() => undefined} />);
    fireEvent.click(await screen.findByRole("button", { name: "So với bộ giải" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
  });

  it("báo không có dữ liệu khi solve không có nhịp từng nước", async () => {
    render(<SolveAnalysisDialog entry={entry({ moveTimes: undefined })} onClose={() => undefined} />);
    expect(await screen.findByText(/không có nhịp từng nước/)).toBeTruthy();
  });
});
