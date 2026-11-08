/** The two columns of a world record: the best single and the best average. */
export type WcaRecordField = "single" | "average";

/**
 * A timed result the way the WCA writes it: hundredths of a second, with
 * minutes and hours only when the result needs them. `251` is `2.51`, while
 * `8747` is `1:27.47`.
 */
export function formatWcaCentiseconds(centiseconds: number) {
  const hours = Math.floor(centiseconds / 360_000);
  const minutes = Math.floor((centiseconds % 360_000) / 6_000);
  const seconds = Math.floor((centiseconds % 6_000) / 100);
  const hundredths = (centiseconds % 100).toString().padStart(2, "0");
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${hundredths}`;
  if (minutes > 0) return `${minutes}:${seconds.toString().padStart(2, "0")}.${hundredths}`;
  return `${seconds}.${hundredths}`;
}

/**
 * Multi-Blind packs the solved count, the time and the missed puzzles into one
 * number, exactly like the WCA results feed: `DDTTTTTMM`, where `DD` encodes
 * the score, `TTTTT` is the time in seconds and `MM` is the number missed.
 */
export function decodeWcaMultiBlind(value: number) {
  const missed = value % 100;
  const rest = Math.floor(value / 100);
  const timeSeconds = rest % 100_000;
  const difference = 99 - (Math.floor(rest / 100_000) % 100);
  const solved = difference + missed;
  return { solved, attempted: solved + missed, timeSeconds };
}

/** A Multi-Blind time, such as `58:23` or `1:02:03`. */
export function formatWcaMultiBlindTime(timeSeconds: number) {
  if (timeSeconds < 60) return `0:${timeSeconds}`;
  const hours = Math.floor(timeSeconds / 3_600);
  const minutes = Math.floor((timeSeconds % 3_600) / 60);
  const seconds = (timeSeconds % 60).toString().padStart(2, "0");
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds}`;
  return `${minutes}:${seconds}`;
}

/** A Multi-Blind world record, such as `63/65 58:23`. */
export function formatWcaMultiBlind(value: number) {
  const { solved, attempted, timeSeconds } = decodeWcaMultiBlind(value);
  const time = timeSeconds === 99_999 ? "?:??:??" : formatWcaMultiBlindTime(timeSeconds);
  return `${solved}/${attempted} ${time}`;
}

/**
 * The display value of a world record. Fewest moves counts moves for the
 * single but centi-moves for the average; timed events use centiseconds and
 * Multi-Blind has no average.
 */
export function formatWcaRecordValue(eventId: string, field: WcaRecordField, value: number | null) {
  if (value === null || value <= 0) return "—";
  if (eventId === "333fm") return field === "average" ? (value / 100).toFixed(2) : String(value);
  if (eventId === "333mbf") return field === "single" ? formatWcaMultiBlind(value) : "—";
  return formatWcaCentiseconds(value);
}
