import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Records from "./Records";

type Query = { data?: unknown; isLoading?: boolean; isError?: boolean; isFetching?: boolean; error?: unknown };

const mocks = vi.hoisted(() => ({
  records: { data: undefined, isLoading: false, isError: false, isFetching: false } as Query,
  recent: { data: undefined, isLoading: false, isError: false } as Query,
  history: [] as unknown[],
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    wca: {
      records: { useQuery: () => mocks.records },
      recentRecords: { useQuery: () => mocks.recent },
    },
  },
}));

vi.mock("@/lib/solveHistory", async importOriginal => ({
  ...(await importOriginal<typeof import("@/lib/solveHistory")>()),
  readSolveHistory: () => mocks.history,
}));

const row = (eventId: string, single: number | null, average: number | null) => ({ eventId, single, average });

beforeEach(() => {
  mocks.records = {
    data: {
      world: [row("333", 347, 405), row("222", 39, 86), row("333mbf", 380350302, null)],
      continents: [{ id: "_Asia", name: "Asia", records: [row("333", 371, 419)] }],
      countries: [{ name: "Vietnam", iso2: "VN", records: [row("333", 694, 850)] }],
    },
    isLoading: false,
    isError: false,
    isFetching: false,
  };
  mocks.recent = {
    data: [
      { id: "1", tag: "WR", type: "single", eventId: "222", attemptResult: 39, personName: "Teodor Zajder", wcaId: "2021ZAJD03", countryIso2: "PL", competitionId: "PolishChampionship2026", competitionName: "Polish Championship 2026", enteredAt: "2026-11-21T15:06:57Z" },
      { id: "2", tag: "NR", type: "average", eventId: "333", attemptResult: 932, personName: "Lere", wcaId: null, countryIso2: "BW", competitionId: null, competitionName: "Botswana Nationals 2026", enteredAt: "2026-11-20T10:00:00Z" },
    ],
    isLoading: false,
    isError: false,
  };
  mocks.history = [];
});
afterEach(() => cleanup());

describe("the WCA records page", () => {
  it("shows the world records with correctly formatted times", () => {
    render(<Records />);
    expect(screen.getByRole("heading", { level: 1, name: "Kỷ lục WCA" })).toBeInTheDocument();
    expect(screen.getByText("3.47")).toBeInTheDocument();
    expect(screen.getByText("4.05")).toBeInTheDocument();
    expect(screen.getAllByText("0.39").length).toBeGreaterThan(0);
    expect(screen.getByText("63/65 58:23")).toBeInTheDocument();
  });

  it("switches to a country and shows how far it is from the world record", () => {
    render(<Records />);
    fireEvent.click(screen.getByRole("button", { name: "Quốc gia" }));
    expect(screen.getByText("6.94")).toBeInTheDocument();
    expect(screen.getByText("×2.00 so với kỷ lục thế giới")).toBeInTheDocument();
    expect(screen.getByText("×2.10 so với kỷ lục thế giới")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quốc gia" })).toHaveAttribute("aria-pressed", "true");
  });

  it("lists recent records and filters them by level", () => {
    render(<Records />);
    expect(screen.getByText("Teodor Zajder")).toBeInTheDocument();
    expect(screen.getByText("Lere")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Quốc gia · 1/ }));
    expect(screen.queryByText("Teodor Zajder")).toBeNull();
    expect(screen.getByText("Lere")).toBeInTheDocument();
  });

  it("compares your own best with the record when the history has solves", () => {
    mocks.history = [
      { id: "a", eventId: "333", elapsedMs: 9_000, penalty: "none", createdAt: 1 },
      { id: "b", eventId: "333", elapsedMs: 12_000, penalty: "none", createdAt: 2 },
    ];
    render(<Records />);
    expect(screen.getByText(/Bạn: 00:09.00/)).toBeInTheDocument();
    expect(screen.getByText(/chậm hơn 5\.53 s/)).toBeInTheDocument();
  });

  it("keeps the records table when WCA Live fails", () => {
    mocks.recent = { data: undefined, isLoading: false, isError: true, error: new Error("x") };
    render(<Records />);
    expect(screen.getByText("3.47")).toBeInTheDocument();
    expect(screen.getByText("Không tải được kỷ lục mới")).toBeInTheDocument();
  });

  it("says so when the records cannot be loaded", () => {
    mocks.records = { data: undefined, isLoading: false, isError: true, isFetching: false, error: new Error("x") };
    render(<Records />);
    expect(screen.getByText("Không thể tải kỷ lục.")).toBeInTheDocument();
  });
});
