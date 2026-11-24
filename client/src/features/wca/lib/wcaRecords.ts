export type WcaRecordField = "single" | "average";

export function formatWcaCentiseconds(centiseconds: number) {
  const hours = Math.floor(centiseconds / 360_000);
  const minutes = Math.floor((centiseconds % 360_000) / 6_000);
  const seconds = Math.floor((centiseconds % 6_000) / 100);
  const hundredths = (centiseconds % 100).toString().padStart(2, "0");
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${hundredths}`;
  if (minutes > 0) return `${minutes}:${seconds.toString().padStart(2, "0")}.${hundredths}`;
  return `${seconds}.${hundredths}`;
}

export function decodeWcaMultiBlind(value: number) {
  const missed = value % 100;
  const rest = Math.floor(value / 100);
  const timeSeconds = rest % 100_000;
  const difference = 99 - (Math.floor(rest / 100_000) % 100);
  const solved = difference + missed;
  return { solved, attempted: solved + missed, timeSeconds };
}

export function formatWcaMultiBlindTime(timeSeconds: number) {
  if (timeSeconds < 60) return `0:${timeSeconds}`;
  const hours = Math.floor(timeSeconds / 3_600);
  const minutes = Math.floor((timeSeconds % 3_600) / 60);
  const seconds = (timeSeconds % 60).toString().padStart(2, "0");
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds}`;
  return `${minutes}:${seconds}`;
}

export function formatWcaMultiBlind(value: number) {
  const { solved, attempted, timeSeconds } = decodeWcaMultiBlind(value);
  const time = timeSeconds === 99_999 ? "?:??:??" : formatWcaMultiBlindTime(timeSeconds);
  return `${solved}/${attempted} ${time}`;
}

export function formatWcaRecordValue(eventId: string, field: WcaRecordField, value: number | null) {
  if (value === null || value <= 0) return "—";
  if (eventId === "333fm") return field === "average" ? (value / 100).toFixed(2) : String(value);
  if (eventId === "333mbf") return field === "single" ? formatWcaMultiBlind(value) : "—";
  return formatWcaCentiseconds(value);
}
