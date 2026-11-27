import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MyCompetitionsPanel } from "./MyCompetitionsPanel";

type Query = { data?: unknown; isLoading?: boolean; isError?: boolean; isFetching?: boolean; error?: unknown };

const mocks = vi.hoisted(() => ({
  account: { data: undefined, isLoading: false } as Query,
  mine: { data: undefined, isLoading: false, isError: false, isFetching: false } as Query,
  profile: { data: undefined } as Query,
  detail: { data: undefined, isLoading: false, isError: false } as Query,
  fetchPast: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ cfopAccount: { wca: { pastCompetitions: { fetch: mocks.fetchPast } } } }),
    cfopAccount: {
      me: { useQuery: () => mocks.account },
      wca: {
        myCompetitions: { useQuery: () => mocks.mine },
        profile: { useQuery: () => mocks.profile },
        competitionDetail: { useQuery: () => mocks.detail },
      },
    },
  },
}));

function info(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    name: `Giải ${id}`,
    shortName: `Giải ${id}`,
    startDate: "2099-12-12",
    endDate: "2099-12-13",
    city: "Hà Nội",
    countryIso2: "VN",
    venue: "Trung tâm",
    venueAddress: "1 Phố Cổ",
    venueDetails: null,
    latitude: 21.03,
    longitude: 105.85,
    eventIds: ["333", "skewb"],
    mainEventId: "333",
    registrationOpen: "2020-01-01T00:00:00.000Z",
    registrationClose: "2099-12-01T00:00:00.000Z",
    announcedAt: null,
    cancelledAt: null,
    resultsPostedAt: null,
    competitorLimit: 100,
    entryFee: { lowestDenomination: 15000000, currency: "VND" },
    guestsEnabled: true,
    guestsPerRegistrationLimit: null,
    guestsEntryFee: null,
    eventsPerRegistrationLimit: null,
    onTheSpotRegistration: null,
    onTheSpotEntryFee: null,
    refundPolicyPercent: 50,
    refundPolicyLimitDate: "2099-11-01T00:00:00.000Z",
    eventChangeDeadlineDate: null,
    waitingListDeadlineDate: null,
    qualificationResults: null,
    spotsLeft: 12,
    waitingListCount: 0,
    registrationFull: false,
    numberOfBookmarks: 7,
    scoretakingSoftware: "wca_live",
    seriesIds: [],
    information: "Mang theo cube của bạn.",
    extraRegistrationRequirements: null,
    externalRegistrationPage: null,
    website: null,
    wcaUrl: `https://www.worldcubeassociation.org/competitions/${id}`,
    liveUrl: `https://live.worldcubeassociation.org/link/competitions/${id}`,
    delegates: [{ name: "Delegate A", wcaId: "2010AAAA01" }],
    organizers: [{ name: "CLB Rubik", wcaId: null }],
    ...overrides,
  };
}

beforeEach(() => {
  mocks.account = { data: undefined, isLoading: false };
  mocks.mine = { data: undefined, isLoading: false, isError: false, isFetching: false };
  mocks.profile = { data: undefined };
  mocks.detail = { data: undefined, isLoading: false, isError: false };
  mocks.fetchPast.mockReset();
});
afterEach(() => cleanup());

describe("my WCA competitions", () => {
  it("asks visitors to sign in", () => {
    render(<MyCompetitionsPanel />);
    expect(screen.getByText(/Đăng nhập để xem giải/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Mở trang hồ sơ/ })).toHaveAttribute("href", "/profile");
  });

  it("asks signed-in people without a WCA ID to link one", () => {
    mocks.account.data = { id: 1, wcaId: null };
    render(<MyCompetitionsPanel />);
    expect(screen.getByText(/Chưa liên kết WCA ID/)).toBeInTheDocument();
  });

  it("lists ongoing, upcoming and past competitions", () => {
    mocks.account.data = { id: 1, wcaId: "2020NGUY01" };
    mocks.profile.data = {
      competitionCount: 12,
      medals: { gold: 1, silver: 2, bronze: 3, total: 6 },
      personalRecords: [
        {
          eventId: "333",
          singleCentiseconds: 812,
          averageCentiseconds: 954,
          singleRanks: { world: 120, continental: 30, country: 2 },
          averageRanks: { world: null, continental: null, country: 3 },
        },
      ],
    };
    mocks.mine.data = {
      wcaId: "2020NGUY01",
      upcoming: [
        { status: "ongoing", competition: info("DangDienRa"), summary: null },
        { status: "upcoming", competition: info("SapToi"), summary: null },
      ],
      past: {
        total: 12,
        items: [
          {
            status: "past",
            competition: info("DaQua", { startDate: "2020-01-01", endDate: "2020-01-02", resultsPostedAt: "2020-01-05T00:00:00Z" }),
            summary: { competitionId: "DaQua", events: 3, rounds: 5, podiums: 2, recency: 10 },
          },
        ],
      },
    };
    render(<MyCompetitionsPanel />);
    expect(screen.getByRole("heading", { name: /Đang diễn ra/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Sắp tới/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Đã tham gia/ })).toBeInTheDocument();
    expect(screen.getByText("Giải SapToi")).toBeInTheDocument();
    expect(screen.getByText("Giải DaQua")).toBeInTheDocument();
    expect(screen.getByText(/3 môn · 5 vòng/)).toBeInTheDocument();
    expect(screen.getByText(/2 bục/)).toBeInTheDocument();
    expect(screen.getByText(/12 giải đã thi/)).toBeInTheDocument();
    expect(screen.getByText(/1 vàng · 2 bạc · 3 đồng/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Kỷ lục cá nhân/ })).toBeInTheDocument();
    expect(screen.getByText("8.12")).toBeInTheDocument();
    expect(screen.getByText(/TG #120 · CL #30 · QG #2/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hiện thêm giải/ })).toBeInTheDocument();
  });

  it("explains an empty upcoming list and shows details on demand", () => {
    mocks.account.data = { id: 1, wcaId: "2020NGUY01" };
    mocks.mine.data = {
      wcaId: "2020NGUY01",
      upcoming: [{ status: "upcoming", competition: info("SapToi"), summary: null }],
      past: { total: 0, items: [] },
    };
    mocks.detail.data = {
      competition: info("SapToi"),
      registeredEventIds: ["333"],
      registrations: { total: 40, byEvent: { "333": 30, skewb: 10 } },
      rounds: [
        {
          id: "333-r1",
          eventId: "333",
          round: 1,
          format: "a",
          timeLimitCentiseconds: 12000,
          timeLimitCumulative: false,
          cutoff: { attempts: 2, centiseconds: 3000 },
          advancement: { type: "ranking", level: 16 },
          scrambleSetCount: 2,
        },
      ],
      results: [],
      schedule: [
        {
          code: "333-r1",
          name: "3x3x3 Cube, Round 1",
          eventId: "333",
          round: 1,
          room: "Phòng A",
          startTime: "2099-12-12T03:00:00Z",
          endTime: "2099-12-12T04:00:00Z",
          timezone: "Asia/Ho_Chi_Minh",
        },
      ],
    };
    render(<MyCompetitionsPanel />);
    expect(screen.queryByText("3x3x3 Cube, Round 1")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Xem chi tiết/ }));
    expect(screen.getByText("3x3x3 Cube, Round 1")).toBeInTheDocument();
    expect(screen.getByText(/10:00–11:00/)).toBeInTheDocument();
    expect(screen.getByText(/Bạn đã đăng ký 1 môn/)).toBeInTheDocument();
    expect(screen.getByText("Delegate A")).toBeInTheDocument();
    expect(screen.getByText(/40 người đăng ký công khai/)).toBeInTheDocument();
    expect(screen.getByText(/Còn 12 chỗ/)).toBeInTheDocument();
    expect(screen.getByText("Mang theo cube của bạn.")).toBeInTheDocument();
    expect(screen.getByText(/50% đến/)).toBeInTheDocument();
    expect(screen.getByText("Trung bình của 5")).toBeInTheDocument();
    expect(screen.getByText("Top 16")).toBeInTheDocument();
    expect(screen.getByText("30.00 sau 2 lần")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /WCA Live/ })).toHaveAttribute(
      "href",
      "https://live.worldcubeassociation.org/link/competitions/SapToi"
    );
    expect(screen.getByRole("button", { name: /Ẩn chi tiết/ })).toHaveAttribute("aria-expanded", "true");
  });
});
