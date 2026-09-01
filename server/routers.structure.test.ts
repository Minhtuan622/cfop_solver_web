import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { accountRouter, authRouter } from "./routers/account";
import { competitionRouter } from "./routers/competition";
import { wcaRouter } from "./routers/wca";

function procedureKeys(router: typeof appRouter) {
  return Object.keys(router._def.procedures).sort();
}

describe("domain router composition", () => {
  it("exports focused Account, Competition and WCA routers", () => {
    expect(Object.keys(accountRouter._def.procedures).sort()).toEqual([
      "changePassword",
      "cloudState.get",
      "cloudState.save",
      "login",
      "logout",
      "me",
      "profile",
      "register",
      "requestPasswordReset",
      "resetPassword",
      "updateProfile",
      "uploadAvatar",
      "wca.oauthStatus",
      "wca.profile",
      "wca.setId",
      "wca.startOAuth",
      "wca.unlink",
    ]);
    expect(Object.keys(competitionRouter._def.procedures).sort()).toHaveLength(18);
    expect(Object.keys(wcaRouter._def.procedures).sort()).toEqual(["competitions", "countries"]);
    expect(Object.keys(authRouter._def.procedures).sort()).toEqual(["logout", "me"]);
  });

  it("preserves the public tRPC namespace consumed by the frontend", () => {
    expect(Object.keys(appRouter._def.record).sort()).toEqual(["auth", "cfopAccount", "competition", "system", "wca"]);
    expect(procedureKeys(appRouter as typeof appRouter)).toEqual(expect.arrayContaining([
      "auth.logout",
      "auth.me",
      "cfopAccount.login",
      "cfopAccount.wca.profile",
      "competition.leaderboard",
      "competition.playerHistory",
      "wca.competitions",
      "wca.countries",
    ]));
  });
});
