import { describe, expect, it } from "vitest";
import { competitionMemberSelect, competitionMessageSelect, competitionResultSelect, competitionRoomMembershipSelect, finishedCompetitionResultSelect } from "./db/selectors";

const keys = (selector: object) => Object.keys(selector).sort();

describe("typed competition selectors", () => {
  it("keeps member, message and room membership shapes explicit", () => {
    expect(keys(competitionRoomMembershipSelect)).toEqual(["joinedAt", "room"]);
    expect(keys(competitionMemberSelect)).toEqual(["accountId", "avatarUrl", "displayName", "joinedAt", "lastSeen", "role"]);
    expect(keys(competitionMessageSelect)).toEqual(["accountId", "avatarUrl", "content", "createdAt", "displayName", "id"]);
  });

  it("keeps both competition result shapes complete", () => {
    expect(keys(competitionResultSelect)).toEqual(["accountId", "avatarUrl", "displayName", "elapsedMs", "inspectionMs", "multiBlindAttempted", "multiBlindScore", "multiBlindSolved", "penalty", "roundId", "roundSequence", "submittedAt"]);
    expect(keys(finishedCompetitionResultSelect)).toEqual(["accountId", "avatarUrl", "displayName", "elapsedMs", "multiBlindAttempted", "multiBlindScore", "multiBlindSolved", "penalty", "roomEventId", "roomFormat", "roomId", "roundSequence"]);
  });
});
