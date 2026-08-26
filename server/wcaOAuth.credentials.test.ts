import { afterEach, describe, expect, it } from "vitest";
import { wcaOAuthConfigured } from "./wcaOAuth";

const originalRedirectUri = process.env.WCA_OAUTH_REDIRECT_URI;

afterEach(() => {
  if (originalRedirectUri === undefined) delete process.env.WCA_OAUTH_REDIRECT_URI;
  else process.env.WCA_OAUTH_REDIRECT_URI = originalRedirectUri;
});

describe("WCA OAuth configuration", () => {
  it("stays disabled until the callback is a stable HTTPS URL", () => {
    process.env.WCA_OAUTH_REDIRECT_URI = "http://localhost:3000/api/wca/oauth/callback";
    expect(wcaOAuthConfigured()).toBe(false);
  });
});
