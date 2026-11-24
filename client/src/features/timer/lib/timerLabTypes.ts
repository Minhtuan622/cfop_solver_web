import type { WordParams } from "@/lib/i18n";

export type TimerWcaRecord = {
  eventId: string;
  singleCentiseconds: number | null;
  averageCentiseconds: number | null;
};
export type Translate = (key: string, params?: WordParams) => string;

