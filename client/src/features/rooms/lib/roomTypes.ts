import type { TimerCompletion } from "@/components/common/SolveTimer";
import type { CompetitionPenalty } from "@/features/competition";

/** A finished solve that is waiting for the room to accept it. */
export type PendingSolve = Pick<
  TimerCompletion,
  "elapsedMs" | "inspectionMs" | "automaticPenalty"
>;

export type RoomRole = "player" | "spectator" | "moderator";

/** The part of a room member the presentation layer needs. */
export type RoomMember = {
  accountId: number;
  displayName: string;
  role: RoomRole;
};

export type RemovalTarget = Pick<RoomMember, "accountId" | "displayName">;

/** A room the signed-in account still belongs to. */
export type RoomSummary = {
  id: number;
  code: string;
  name: string;
  eventId: string;
};

/** A scored result, shaped the way the competition feature labels it. */
export type RoomResult = {
  elapsedMs: number;
  penalty: CompetitionPenalty;
  multiBlindScore?: number | null;
};

export type RoomStanding = {
  accountId: number;
  displayName: string;
  lastResult: RoomResult | null;
};

export type RoomMessage = {
  id: number;
  displayName: string;
  content: string;
};

export type RoomModerationEntry = {
  id: number;
  actorDisplayName: string;
  targetDisplayName: string;
  reason: string;
  createdAt: string | Date;
};

/** The round a room is currently running. */
export type RoomActiveRound = {
  id: number;
  sequence: number;
  scramble: string;
  scrambleBundle: string[];
};
