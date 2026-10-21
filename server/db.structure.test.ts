import { describe, expect, it } from "vitest";
import * as db from "./db";
import * as core from "./db/core";
import * as account from "./db/account";
import * as competition from "./db/competition";
import * as wca from "./db/wca";

describe("database domain composition", () => {
  it("keeps the legacy db.ts import boundary intact", () => {
    expect(db.getDb).toBe(core.getDb);
    expect(db.requireDb).toBe(core.requireDb);
    expect(db.findCfopAccountByEmail).toBe(account.findCfopAccountByEmail);
    expect(db.findCfopAccountPublicById).toBe(account.findCfopAccountPublicById);
    expect(db.findCfopAccountWcaById).toBe(account.findCfopAccountWcaById);
    expect(db.saveCfopAccountCloudState).toBe(account.saveCfopAccountCloudState);
    expect(db.createCfopWcaOauthState).toBe(wca.createCfopWcaOauthState);
    expect(db.consumeCfopWcaOauthState).toBe(wca.consumeCfopWcaOauthState);
    expect(db.createCompetitionRoom).toBe(competition.createCompetitionRoom);
    expect(db.listCompetitionResults).toBe(competition.listCompetitionResults);
    expect(db.listCompetitionMessages).toBe(competition.listCompetitionMessages);
  });

  it("exposes no duplicate implementation in the barrel", () => {
    const exportedFunctions = Object.entries(db).filter(([, value]) => typeof value === "function");
    expect(exportedFunctions.length).toBeGreaterThan(30);
    expect(new Set(exportedFunctions.map(([, value]) => value)).size).toBe(exportedFunctions.length);
  });
});
