import { cfopWcaOauthStates } from "../../drizzle/schema";

/** OAuth state fields required to validate, consume and associate a WCA callback. */
export const cfopWcaOauthStateSelect = {
  id: cfopWcaOauthStates.id,
  accountId: cfopWcaOauthStates.accountId,
  stateHash: cfopWcaOauthStates.stateHash,
  expiresAt: cfopWcaOauthStates.expiresAt,
  createdAt: cfopWcaOauthStates.createdAt,
};
