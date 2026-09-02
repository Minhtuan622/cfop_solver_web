import { cfopAccounts } from "../../drizzle/schema";

/** Public account fields safe for profile and identity responses. */
export const cfopAccountPublicSelect = {
  id: cfopAccounts.id,
  email: cfopAccounts.email,
  displayName: cfopAccounts.displayName,
  bio: cfopAccounts.bio,
  avatarUrl: cfopAccounts.avatarUrl,
  goalMs: cfopAccounts.goalMs,
  wcaId: cfopAccounts.wcaId,
  createdAt: cfopAccounts.createdAt,
  lastSignedIn: cfopAccounts.lastSignedIn,
};

/** Minimal account identity needed by WCA linking and profile lookups. */
export const cfopAccountWcaSelect = {
  id: cfopAccounts.id,
  wcaId: cfopAccounts.wcaId,
  displayName: cfopAccounts.displayName,
  avatarUrl: cfopAccounts.avatarUrl,
};
