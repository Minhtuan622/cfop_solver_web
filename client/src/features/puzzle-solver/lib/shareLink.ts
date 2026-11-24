/**
 * Link chia sẻ của trang Giải: đưa loại khối và đầu vào (scramble hoặc trạng
 * thái 3×3) vào query của URL, không cần server. Người mở link thấy đúng đầu
 * vào và lời giải tự chạy. Mọi giá trị đọc từ URL đều bị kiểm tra: link là dữ
 * liệu từ bên ngoài, không phải lệnh.
 */
import { MAX_SCRAMBLE_LENGTH, OTHER_PUZZLE_IDS, normalizeScramble } from "./puzzleSolve";

/** Giá trị `k` hợp lệ: ba chế độ 3×3 và các khối trong dropdown. */
export const SHARE_KINDS = ["cfop", "bld", "fm", ...OTHER_PUZZLE_IDS] as const;
export type ShareKind = (typeof SHARE_KINDS)[number];

export type ShareInput =
  | { kind: ShareKind; scramble: string; facelets?: undefined }
  | { kind: "cfop" | "bld"; facelets: string; scramble?: undefined };

const SCRAMBLE_CHARS = /^[A-Za-z0-9'+\- ]+$/;
const FACELETS = /^[URFDLB]{54}$/;

export function isShareKind(value: string | null): value is ShareKind {
  return value !== null && (SHARE_KINDS as readonly string[]).includes(value);
}

/** Đọc `?k=…&s=…` hoặc `?k=…&f=…`; `null` nếu thiếu hoặc không hợp lệ. */
export function parseShareParams(search: string): ShareInput | null {
  const params = new URLSearchParams(search);
  const kind = params.get("k");
  if (!isShareKind(kind)) return null;
  const facelets = params.get("f");
  if (facelets !== null) {
    if ((kind === "cfop" || kind === "bld") && FACELETS.test(facelets)) return { kind, facelets };
    return null;
  }
  const raw = params.get("s");
  if (raw === null) return null;
  const scramble = normalizeScramble(raw);
  if (!scramble || scramble.length > MAX_SCRAMBLE_LENGTH || !SCRAMBLE_CHARS.test(scramble))
    return null;
  return { kind, scramble };
}

/** Dựng URL tuyệt đối tới trang Giải cho đầu vào này. */
export function buildShareUrl(origin: string, input: ShareInput) {
  const params = new URLSearchParams({ k: input.kind });
  if (input.facelets !== undefined) params.set("f", input.facelets);
  else params.set("s", normalizeScramble(input.scramble));
  return `${origin}/?${params.toString()}`;
}
