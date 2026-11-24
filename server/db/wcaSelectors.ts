import { cfopWcaOauthStates } from "../../drizzle/schema";

export const cfopWcaOauthStateSelect = {
  id: cfopWcaOauthStates.id,
  accountId: cfopWcaOauthStates.accountId,
  stateHash: cfopWcaOauthStates.stateHash,
  expiresAt: cfopWcaOauthStates.expiresAt,
  createdAt: cfopWcaOauthStates.createdAt,
};
