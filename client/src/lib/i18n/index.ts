import { competitionWords } from "./competition";
import { commonWords } from "./common";
import { historyWords } from "./history";
import { playWords } from "./play";
import { profileWords } from "./profile";
import { roomsWords } from "./rooms";
import { settingsWords } from "./settings";
import { shellWords } from "./shell";
import { solverWords } from "./solver";
import { studyWords } from "./study";
import { timerWords } from "./timer";
import { wcaWords } from "./wca";

export type Language = "vi" | "en";
export type WordPair = [string, string];
export type Dictionary = Record<string, WordPair>;
export type WordParams = Record<string, string | number>;
export type Translate = (key: string, params?: WordParams) => string;

export const words: Dictionary = {
  ...commonWords,
  ...shellWords,
  ...solverWords,
  ...studyWords,
  ...timerWords,
  ...historyWords,
  ...settingsWords,
  ...roomsWords,
  ...profileWords,
  ...competitionWords,
  ...wcaWords,
  ...playWords,
};

export function translate(language: Language, key: string, params?: WordParams): string {
  const entry = words[key];
  if (!entry) return key;
  const text = language === "vi" ? entry[0] : entry[1];
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
