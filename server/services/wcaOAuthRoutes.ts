import type { Express } from "express";
import { getCfopAccountFromRequest } from "./cfopAccountAuth";
import { completeWcaOAuth, wcaOAuthCallbackReturnPath } from "./wcaOAuth";

function firstQueryValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function registerWcaOAuthRoutes(app: Express) {
  app.get("/api/wca/oauth/callback", async (req, res) => {
    const code = firstQueryValue(req.query.code);
    const state = firstQueryValue(req.query.state);
    const account = await getCfopAccountFromRequest(req);
    if (!code || !state || !account) {
      res.redirect(wcaOAuthCallbackReturnPath(req, "error"));
      return;
    }
    try {
      await completeWcaOAuth({ code, state, activeAccountId: account.id });
      res.redirect(wcaOAuthCallbackReturnPath(req, "linked"));
    } catch {
      res.redirect(wcaOAuthCallbackReturnPath(req, "error"));
    }
  });
}
