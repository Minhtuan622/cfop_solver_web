import { cfopAccounts, cfopCompetitionMembers, cfopCompetitionMessages, cfopCompetitionResults, cfopCompetitionRooms, cfopCompetitionRounds } from "../../drizzle/schema";

export const competitionRoomMembershipSelect = {
  room: cfopCompetitionRooms,
  joinedAt: cfopCompetitionMembers.joinedAt,
};

export const competitionMemberSelect = {
  accountId: cfopCompetitionMembers.accountId,
  displayName: cfopAccounts.displayName,
  avatarUrl: cfopAccounts.avatarUrl,
  role: cfopCompetitionMembers.role,
  joinedAt: cfopCompetitionMembers.joinedAt,
  lastSeen: cfopCompetitionMembers.lastSeen,
};

export const competitionMessageSelect = {
  id: cfopCompetitionMessages.id,
  accountId: cfopCompetitionMessages.accountId,
  content: cfopCompetitionMessages.content,
  createdAt: cfopCompetitionMessages.createdAt,
  displayName: cfopAccounts.displayName,
  avatarUrl: cfopAccounts.avatarUrl,
};

export const competitionResultSelect = {
  roundSequence: cfopCompetitionRounds.sequence,
  roundId: cfopCompetitionRounds.id,
  accountId: cfopCompetitionResults.accountId,
  displayName: cfopAccounts.displayName,
  avatarUrl: cfopAccounts.avatarUrl,
  elapsedMs: cfopCompetitionResults.elapsedMs,
  inspectionMs: cfopCompetitionResults.inspectionMs,
  penalty: cfopCompetitionResults.penalty,
  multiBlindAttempted: cfopCompetitionResults.multiBlindAttempted,
  multiBlindSolved: cfopCompetitionResults.multiBlindSolved,
  multiBlindScore: cfopCompetitionResults.multiBlindScore,
  submittedAt: cfopCompetitionResults.submittedAt,
};

export const finishedCompetitionResultSelect = {
  roomId: cfopCompetitionRooms.id,
  roomFormat: cfopCompetitionRooms.format,
  roomEventId: cfopCompetitionRooms.eventId,
  accountId: cfopCompetitionResults.accountId,
  displayName: cfopAccounts.displayName,
  avatarUrl: cfopAccounts.avatarUrl,
  elapsedMs: cfopCompetitionResults.elapsedMs,
  penalty: cfopCompetitionResults.penalty,
  multiBlindAttempted: cfopCompetitionResults.multiBlindAttempted,
  multiBlindSolved: cfopCompetitionResults.multiBlindSolved,
  multiBlindScore: cfopCompetitionResults.multiBlindScore,
  roundSequence: cfopCompetitionRounds.sequence,
};
