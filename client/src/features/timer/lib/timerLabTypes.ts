/** Kiểu dùng chung giữa trang Bấm giờ và các thẻ/ảnh export của nó. */
import type { WordParams } from "@/lib/i18n";

export type TimerWcaRecord = {
  eventId: string;
  singleCentiseconds: number | null;
  averageCentiseconds: number | null;
};
/** Resolves a `namespace.key` entry of the shared bilingual dictionary. */
export type Translate = (key: string, params?: WordParams) => string;

