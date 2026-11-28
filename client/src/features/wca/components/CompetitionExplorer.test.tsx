import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CompetitionExplorer } from "./CompetitionExplorer";

const row = (pos: number, name: string, best: number, extra: Record<string, unknown> = {}) => ({
  pos,
  name,
  wcaId: `2020TEST0${pos}`,
  countryIso2: "VN",
  best,
  average: best + 100,
  attempts: [best, best + 50, best + 100, best + 150, best + 200],
  singleRecord: null,
  averageRecord: null,
  ...extra,
});

const mocks = vi.hoisted(() => ({
  results: { data: undefined as unknown, isLoading: false, isError: false },
  psych: { data: undefined as unknown, isLoading: false, isError: false },
  schedule: { data: undefined as unknown, isLoading: false, isError: false },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    wca: {
      competitionResults: { useQuery: () => mocks.results },
      psychSheet: { useQuery: () => mocks.psych },
      competitionSchedule: { useQuery: () => mocks.schedule },
    },
    cfopAccount: {
      wca: {
        profile: { useQuery: () => ({ data: undefined }) },
        competitionAgenda: { useQuery: () => ({ data: undefined, isLoading: true, isError: false }) },
      },
    },
  },
}));

afterEach(cleanup);

describe("CompetitionExplorer", () => {
  it("shows the podium and the full table of the final round", () => {
    mocks.results.data = {
      resultCount: 4,
      events: [
        {
          eventId: "333",
          rounds: [
            {
              roundTypeId: "f",
              formatId: "a",
              rows: [row(1, "An", 600, { singleRecord: "NR" }), row(2, "Binh", 700), row(3, "Chi", 800), row(4, "Dung", 900)],
            },
          ],
        },
      ],
    };
    render(<CompetitionExplorer competitionId="Test2027" eventIds={["333"]} />);
    expect(screen.getAllByText("An").length).toBeGreaterThan(1);
    expect(screen.getByText("Dung")).toBeInTheDocument();
    expect(screen.getByText("NR")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dung" })).toHaveAttribute("href", "/wca/persons/2020TEST04");
  });

  it("switches to the psych sheet and highlights nothing without a WCA ID", () => {
    mocks.results.data = { resultCount: 0, events: [] };
    mocks.psych.data = {
      eventId: "333",
      sortBy: "average",
      rows: [
        { pos: 1, name: "Phuoc", wcaId: "2018PHUO05", countryIso2: "VN", single: { best: 494, rank: 318 }, average: { best: 618, rank: 169 } },
      ],
    };
    render(<CompetitionExplorer competitionId="Test2027" eventIds={["333"]} />);
    expect(screen.getByText(/chưa có kết quả|No results/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /psych sheet/i }));
    expect(screen.getByText("Phuoc")).toBeInTheDocument();
    expect(screen.getByText("#169")).toBeInTheDocument();
    expect(screen.getByText("6.18")).toBeInTheDocument();
  });
});
