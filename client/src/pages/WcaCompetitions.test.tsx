import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WcaCompetitions from "./WcaCompetitions";

const mocks = vi.hoisted(() => ({
  countries: { data: undefined as unknown, isLoading: false },
  records: { data: undefined as unknown, isLoading: false, isError: false, error: null as unknown },
  competitions: {
    data: undefined as unknown,
    isLoading: false,
    isError: false,
    isFetching: false,
    error: null as unknown,
  },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    wca: {
      countries: { useQuery: () => mocks.countries },
      competitions: { useQuery: () => mocks.competitions },
      worldRecords: { useQuery: () => mocks.records },
    },
  },
}));

function competition(overrides: Record<string, unknown> = {}) {
  return {
    id: "1",
    name: "Hungarian Open 2026",
    startDate: "2026-10-23",
    endDate: "2026-10-26",
    countryName: "Hungary",
    countryIso2: "HU",
    cityName: "Budapest",
    venueName: "[BOK Hall](https://bok.hu)",
    status: "approved",
    website: null,
    wcaUrl: "https://www.worldcubeassociation.org/competitions/1",
    eventIds: ["333", "222"],
    ...overrides,
  };
}

afterEach(() => cleanup());
beforeEach(() => {
  mocks.countries = { data: [{ id: "1", name: "Hungary", iso2: "HU" }], isLoading: false };
  mocks.records = { data: undefined, isLoading: false, isError: false, error: null };
  mocks.competitions = { data: undefined, isLoading: false, isError: false, isFetching: false, error: null };
});

describe("the WCA competition calendar", () => {
  it("gathers the competitions under the month they start in", () => {
    mocks.competitions.data = [
      competition(),
      competition({ id: "2", name: "Berlin Open", startDate: "2026-11-06", endDate: "2026-11-08", cityName: "Berlin", countryName: "Germany", countryIso2: "DE" }),
    ];

    render(<WcaCompetitions />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const months = screen.getAllByRole("heading", { level: 2 }).filter((heading) => /2026/.test(heading.textContent ?? ""));
    expect(months).toHaveLength(2);
    expect(months[0]).toHaveAccessibleName(/2026/);
    expect(months[1]).toHaveAccessibleName(/2026/);
    expect(screen.getByRole("link", { name: /Hungarian Open 2026/ })).toHaveAttribute(
      "href",
      "https://www.worldcubeassociation.org/competitions/1",
    );
  });

  it("shows the venue as a link instead of the raw markdown the feed writes", () => {
    mocks.competitions.data = [competition()];

    render(<WcaCompetitions />);

    expect(screen.queryByText(/\[BOK Hall\]/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "BOK Hall" })).toHaveAttribute("href", "https://bok.hu");
  });

  it("finds a competition by what the visitor types", () => {
    mocks.competitions.data = [competition(), competition({ id: "2", name: "Berlin Open", cityName: "Berlin" })];

    render(<WcaCompetitions />);
    expect(screen.getAllByRole("link", { name: /Open/ })).toHaveLength(2);

    fireEvent.change(screen.getByLabelText("Tìm giải"), { target: { value: "berlin" } });

    expect(screen.getAllByRole("link", { name: /Open/ })).toHaveLength(1);
  });

  it("offers a way out when the search finds nothing", () => {
    mocks.competitions.data = [competition()];

    render(<WcaCompetitions />);
    fireEvent.change(screen.getByLabelText("Tìm giải"), { target: { value: "nothing here" } });

    expect(screen.getByText("Không tìm thấy giải nào khớp với từ khoá.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Xoá tìm kiếm" }));
    expect(screen.getByRole("link", { name: /Hungarian Open 2026/ })).toBeInTheDocument();
  });

  it("tells the visitor when the period holds no competition at all", () => {
    mocks.competitions.data = [];

    render(<WcaCompetitions />);

    expect(screen.getByText(/Chưa có giải WCA phù hợp/)).toBeInTheDocument();
  });

  it("picks a ready-made period in one click", () => {
    render(<WcaCompetitions />);

    const preset = screen.getByRole("button", { name: "30 ngày" });
    expect(preset).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(preset);
    expect(preset).toHaveAttribute("aria-pressed", "true");
  });

  it("shows the current world records above the calendar", () => {
    mocks.records.data = [
      { eventId: "333", single: 251, average: 351 },
      { eventId: "333fm", single: 16, average: 1900 },
      { eventId: "333mbf", single: 380350302, average: null },
    ];

    render(<WcaCompetitions />);

    expect(screen.getByRole("heading", { name: "Kỷ lục thế giới hiện tại" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Xem \d+ kỷ lục/ }));

    expect(screen.getByText("2.51")).toBeInTheDocument();
    expect(screen.getByText("3.51")).toBeInTheDocument();
    expect(screen.getByText("16")).toBeInTheDocument();
    expect(screen.getByText("19.00")).toBeInTheDocument();
    expect(screen.getByText("63/65 58:23")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Xem trên WCA/ })).toHaveAttribute(
      "href",
      "https://www.worldcubeassociation.org/results/records",
    );
  });
});
