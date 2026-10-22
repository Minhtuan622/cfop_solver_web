import { describe, expect, it } from "vitest";
import { serverMessageKeys } from "@shared/serverMessages";
import { words, translate } from "@/lib/i18n";
import { commonWords } from "./common";
import { competitionWords } from "./competition";
import { historyWords } from "./history";
import { profileWords } from "./profile";
import { roomsWords } from "./rooms";
import { settingsWords } from "./settings";
import { shellWords } from "./shell";
import { solverWords } from "./solver";
import { timerWords } from "./timer";
import { wcaWords } from "./wca";

const namespaces: Record<string, Record<string, [string, string]>> = {
  common: commonWords,
  competition: competitionWords,
  history: historyWords,
  profile: profileWords,
  rooms: roomsWords,
  settings: settingsWords,
  shell: shellWords,
  solver: solverWords,
  timer: timerWords,
  wca: wcaWords,
};

const placeholders = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();

describe("the bilingual dictionary", () => {
  it("holds a sentence for both languages of every entry", () => {
    const incomplete = Object.entries(words)
      .filter(([, pair]) => pair.length !== 2 || !pair[0].trim() || !pair[1].trim())
      .map(([key]) => key);

    expect(incomplete).toEqual([]);
  });

  it("never writes the same key in two namespaces", () => {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];
    for (const [namespace, entries] of Object.entries(namespaces)) {
      for (const key of Object.keys(entries)) {
        const owner = seen.get(key);
        if (owner) duplicates.push(`${key} (${owner} và ${namespace})`);
        else seen.set(key, namespace);
      }
    }

    expect(duplicates).toEqual([]);
  });

  it("uses the same placeholders in both languages", () => {
    const mismatched = Object.entries(words)
      .filter(([, pair]) => placeholders(pair[0]).join(",") !== placeholders(pair[1]).join(","))
      .map(([key]) => key);

    expect(mismatched).toEqual([]);
  });

  it("carries a sentence for every message the server can send", () => {
    const missing = Object.values(serverMessageKeys).filter(key => !(key in words));

    expect(missing).toEqual([]);
  });
});

describe("translate", () => {
  it("reads the language it is asked for", () => {
    expect(translate("vi", "common.error.unknown")).toBe("Không thể hoàn tất. Hãy thử lại.");
    expect(translate("en", "common.error.unknown")).toBe("Something went wrong. Please try again.");
  });

  it("fills the placeholders of a sentence", () => {
    expect(translate("en", "rooms.roomTitle", { code: "AB12" })).toBe("Room AB12");
    expect(translate("vi", "rooms.roomTitle", { code: "AB12" })).toBe("Phòng AB12");
  });

  it("falls back to the key of a sentence that does not exist", () => {
    expect(translate("vi", "does.not.exist")).toBe("does.not.exist");
  });
});
