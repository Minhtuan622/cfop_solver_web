/**
 * The single bilingual vocabulary of the CFOP Solver Studio interface.
 *
 * Every entry is a `[vietnamese, english]` pair and every component reads it
 * through `t("namespace.key")`. Namespaces live in one file each, next to this
 * one, so a page and its strings stay easy to review together.
 */
import { competitionWords } from "./competition";
import { commonWords } from "./common";
import { historyWords } from "./history";
import { profileWords } from "./profile";
import { roomsWords } from "./rooms";
import { settingsWords } from "./settings";
import { shellWords } from "./shell";
import { solverWords } from "./solver";
import { timerWords } from "./timer";
import { wcaWords } from "./wca";

export type Language = "vi" | "en";
export type WordPair = [string, string];
export type Dictionary = Record<string, WordPair>;
/** Values substituted into the `{placeholder}` slots of a dictionary entry. */
export type WordParams = Record<string, string | number>;
/** The `t("namespace.key")` lookup handed out by `useLanguage()`. */
export type Translate = (key: string, params?: WordParams) => string;

export const words: Dictionary = {
  ...commonWords,
  ...shellWords,
  ...solverWords,
  ...timerWords,
  ...historyWords,
  ...settingsWords,
  ...roomsWords,
  ...profileWords,
  ...competitionWords,
  ...wcaWords,
};

/**
 * Resolves a `namespace.key` entry; unknown keys fall back to the key itself.
 * Placeholders are written as `{name}` and filled from `params`.
 */
export function translate(language: Language, key: string, params?: WordParams): string {
  const entry = words[key];
  if (!entry) return key;
  const text = language === "vi" ? entry[0] : entry[1];
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
