/**
 * Gắn cờ kết quả đáng ngờ trong phòng thi. Chỉ GẮN CỜ để chủ phòng/moderator
 * xem xét: kết quả vẫn được nhận và tính điểm bình thường, không tự loại ai.
 *
 * Ba tín hiệu, đều dựa trên dữ liệu server tự biết (không tin thêm client):
 * - `impossible_time`: thời gian khai (kể cả inspection) dài hơn thời gian từ
 *   lúc lượt bắt đầu đến lúc nộp — không thể xảy ra nếu bấm giờ thật.
 * - `too_fast`: nhanh hơn một nửa kỷ lục thế giới của event.
 * - `repeated_time`: trùng đúng từng mili-giây với một kết quả trước đó của
 *   chính người này trong phòng.
 */

export type IntegrityFlag = "impossible_time" | "too_fast" | "repeated_time";

export const INTEGRITY_FLAGS: readonly IntegrityFlag[] = [
  "impossible_time",
  "too_fast",
  "repeated_time",
];

/** Dung sai độ trễ mạng và đồng hồ giữa client và server. */
export const ROUND_TIME_TOLERANCE_MS = 5_000;

/** Ngưỡng nhanh bất thường theo event: khoảng một nửa kỷ lục thế giới, cố ý rộng tay. */
const MIN_PLAUSIBLE_MS: Record<string, number> = {
  "333": 1_500,
  "222": 300,
  "444": 8_000,
  "555": 17_000,
  "666": 33_000,
  "777": 48_000,
  "333oh": 3_000,
  pyram: 400,
  skewb: 400,
  sq1: 1_700,
  clock: 1_000,
  minx: 9_000,
};

export type IntegrityInput = {
  eventId: string;
  elapsedMs: number;
  inspectionMs: number;
  /** Lúc lượt bắt đầu và lúc server nhận kết quả. */
  roundStartedAt: Date | number;
  now?: number;
  /** `elapsedMs` các kết quả trước đó của cùng người trong phòng. */
  previousElapsedMs: readonly number[];
};

export function competitionIntegrityFlags(input: IntegrityInput): IntegrityFlag[] {
  const flags: IntegrityFlag[] = [];
  const now = input.now ?? Date.now();
  const startedAt =
    input.roundStartedAt instanceof Date
      ? input.roundStartedAt.getTime()
      : input.roundStartedAt;
  const sinceStart = now - startedAt;
  if (input.elapsedMs + input.inspectionMs > sinceStart + ROUND_TIME_TOLERANCE_MS)
    flags.push("impossible_time");
  const floor = MIN_PLAUSIBLE_MS[input.eventId];
  if (floor !== undefined && input.elapsedMs < floor) flags.push("too_fast");
  if (input.previousElapsedMs.includes(input.elapsedMs)) flags.push("repeated_time");
  return flags;
}

/** Lưu cờ trong một cột văn bản ngắn, ngăn cách bằng dấu phẩy. */
export function serializeIntegrityFlags(flags: readonly IntegrityFlag[]) {
  return flags.join(",");
}

/** Đọc lại cờ đã lưu; bỏ qua giá trị lạ để dữ liệu cũ/hỏng không làm hỏng giao diện. */
export function parseIntegrityFlags(value: string | null | undefined): IntegrityFlag[] {
  if (!value) return [];
  return value
    .split(",")
    .filter((flag): flag is IntegrityFlag =>
      (INTEGRITY_FLAGS as readonly string[]).includes(flag)
    );
}
