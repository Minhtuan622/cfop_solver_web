import type { TimerCompletion } from "@/components/common/SolveTimer";
import type { CompetitionPenalty } from "@/features/competition";

export type PendingSolve = Pick<
  TimerCompletion,
  "elapsedMs" | "inspectionMs" | "automaticPenalty"
>;

export type RoomRole = "player" | "spectator" | "moderator";

export type RoomMember = {
  accountId: number;
  displayName: string;
  role: RoomRole;
};

export type RemovalTarget = Pick<RoomMember, "accountId" | "displayName">;

export type RoomSummary = {
  id: number;
  code: string;
  name: string;
  eventId: string;
};

export type RoomResult = {
  elapsedMs: number;
  penalty: CompetitionPenalty;
  multiBlindScore?: number | null;
};

export type RoomIntegrityFlagId = "impossible_time" | "too_fast" | "repeated_time";

export type RoomIntegrityEntry = {
  accountId: number;
  displayName: string;
  roundSequence: number;
  elapsedMs: number;
  penalty: CompetitionPenalty;
  flags: RoomIntegrityFlagId[];
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

export type RoomActiveRound = {
  id: number;
  sequence: number;
  scramble: string;
  scrambleBundle: string[];
};
