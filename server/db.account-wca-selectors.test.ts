import { describe, expect, it } from "vitest";
import { cfopAccountPublicSelect, cfopAccountWcaSelect } from "./db/accountSelectors";
import { cfopWcaOauthStateSelect } from "./db/wcaSelectors";

const keys = (selector: object) => Object.keys(selector).sort();

describe("typed Account and WCA selectors", () => {
  it("keeps public Account fields separate from credentials", () => {
    expect(keys(cfopAccountPublicSelect)).toEqual(["avatarUrl", "bio", "createdAt", "displayName", "email", "goalMs", "id", "lastSignedIn", "wcaId"]);
    expect(keys(cfopAccountPublicSelect)).not.toContain("passwordHash");
    expect(keys(cfopAccountWcaSelect)).toEqual(["avatarUrl", "displayName", "id", "wcaId"]);
  });

  it("keeps only the fields required to consume a WCA OAuth state", () => {
    expect(keys(cfopWcaOauthStateSelect)).toEqual(["accountId", "createdAt", "expiresAt", "id", "stateHash"]);
  });
});
