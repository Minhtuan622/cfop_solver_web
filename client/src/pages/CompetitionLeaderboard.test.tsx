import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CompetitionLeaderboard from "./CompetitionLeaderboard";

const mocks = vi.hoisted(() => ({
  routeMatch: false,
  routeParams: undefined as { accountId: string } | undefined,
  leaderboard: { data: undefined as unknown, isLoading: false, isError: false },
  account: { data: null as unknown, isLoading: false },
  history: { data: undefined as unknown, isLoading: false, isError: false },
  playerHistory: { data: undefined as unknown, isLoading: false, isError: false },
}));

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => <a href={href} {...props}>{children}</a>,
  useRoute: () => [mocks.routeMatch, mocks.routeParams],
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    competition: {
      leaderboard: { useQuery: () => mocks.leaderboard },
      history: { useQuery: () => mocks.history },
      playerHistory: { useQuery: () => mocks.playerHistory },
    },
    cfopAccount: { me: { useQuery: () => mocks.account } },
  },
}));

afterEach(() => cleanup());
beforeEach(() => {
  mocks.routeMatch = false;
  mocks.routeParams = undefined;
  mocks.leaderboard = { data: undefined, isLoading: false, isError: false };
  mocks.account = { data: null, isLoading: false };
  mocks.history = { data: undefined, isLoading: false, isError: false };
  mocks.playerHistory = { data: undefined, isLoading: false, isError: false };
});

describe("CompetitionLeaderboard", () => {
  it("hiển thị bảng xếp hạng và deep-link tới lịch sử người chơi", () => {
    mocks.leaderboard = { data: { startAt: new Date("2026-08-25T00:00:00Z"), endAt: new Date("2026-08-29T00:00:00Z"), players: [{ accountId: 42, displayName: "An", avatarUrl: null, points: 10, wins: 1, rooms: 1, rank: 1 }] }, isLoading: false, isError: false };
    render(<CompetitionLeaderboard />);

    expect(screen.getByRole("heading", { name: "Xếp hạng & lịch sử thi đấu" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "An" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "An" })).toHaveAttribute("href", "/competition/player/42");
    expect(screen.getByLabelText("Bộ môn")).toHaveValue("all");
    fireEvent.change(screen.getByLabelText("Bộ môn"), { target: { value: "333" } });
    expect(screen.getByLabelText("Bộ môn")).toHaveValue("333");
  });

  it("hiển thị chi tiết các vòng và bảng xếp hạng của một phòng", () => {
    mocks.routeMatch = true;
    mocks.routeParams = { accountId: "42" };
    mocks.playerHistory = { data: [{ room: { id: 7, code: "ROOM42", name: "Trận cuối tuần", eventId: "333", format: "ao5", updatedAt: new Date("2026-08-28T12:00:00Z") }, joinedAt: new Date("2026-08-28T10:00:00Z"), roundLimit: 5, myRank: 1, myScore: 9_500, standings: [{ accountId: 42, displayName: "An", avatarUrl: null, lastResult: { elapsedMs: 9_500, penalty: "none" } }, { accountId: 8, displayName: "Bình", avatarUrl: null, lastResult: { elapsedMs: 10_500, penalty: "none" } }], results: [{ roundId: 1, roundSequence: 1, accountId: 42, displayName: "An", avatarUrl: null, elapsedMs: 9_000, inspectionMs: 8_000, penalty: "none", submittedAt: new Date("2026-08-28T10:01:00Z") }] }], isLoading: false, isError: false };
    render(<CompetitionLeaderboard />);

    expect(screen.getByRole("heading", { name: "Lịch sử thi đấu của An" })).toBeInTheDocument();
    expect(screen.getByText("Trận cuối tuần")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Inspection" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /00:09\.00.*8\.0 giây/ })).toBeInTheDocument();
    expect(screen.getByText("Bình")).toBeInTheDocument();
  });
});
