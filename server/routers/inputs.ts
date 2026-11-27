import { z } from "zod";
import { DEFAULT_TIMER_EVENT, TIMER_EVENT_IDS } from "../../shared/timerEvents";

export const MAX_CLOUD_TIMER_ENTRIES = 500;
export const MAX_CLOUD_TIMER_TOMBSTONES = 100;

export const MIN_ELAPSED_MS = 250;

export const passwordInput = z.string().min(10, "Mật khẩu cần ít nhất 10 ký tự.").max(128, "Mật khẩu quá dài.");
export const credentialsInput = z.object({ email: z.string().trim().email("Email không hợp lệ.").max(320), password: passwordInput });
export const profileInput = z.object({ displayName: z.string().trim().min(2, "Tên hiển thị cần ít nhất 2 ký tự.").max(80), bio: z.string().trim().max(280, "Giới thiệu tối đa 280 ký tự."), goalMs: z.number().int().min(1_000, "Mục tiêu cần ít nhất 1 giây.").max(3_600_000, "Mục tiêu tối đa 60 phút.").nullable() });
export const avatarInput = z.object({ data: z.string().min(8).max(2_800_000), contentType: z.enum(["image/jpeg", "image/png", "image/webp"]) });
export const cloudStateInput = z.object({
  schema: z.literal("cfop-account-cloud-state"),
  schemaVersion: z.union([z.literal(1), z.literal(2)]).optional(),
  version: z.union([z.literal(1), z.literal(2)]).optional(),
  baseVersion: z.number().int().nonnegative().nullable().optional(),
  capturedAt: z.number().int().nonnegative(),
  timer: z.array(z.unknown()).max(MAX_CLOUD_TIMER_ENTRIES + MAX_CLOUD_TIMER_TOMBSTONES),
  lastLayer: z.object({ study: z.unknown(), masteredCaseKeys: z.array(z.string().max(120)).max(1800) }),
  bldProfile: z.unknown(),
  bldLearningPath: z.unknown(),
  twoByTwo: z.object({ study: z.unknown(), masteredCaseKeys: z.array(z.string().max(120)).max(1800) }).optional(),
  pyraminx: z.object({ study: z.unknown(), masteredCaseKeys: z.array(z.string().max(120)).max(1800) }).optional(),
  skewb: z.object({ study: z.unknown(), masteredCaseKeys: z.array(z.string().max(120)).max(1800) }).optional(),
  roux: z.object({ study: z.unknown(), masteredCaseKeys: z.array(z.string().max(120)).max(1800) }).optional(),
  sq1: z.object({ study: z.unknown(), masteredCaseKeys: z.array(z.string().max(120)).max(1800) }).optional(),
  parity: z.object({ study: z.unknown(), masteredCaseKeys: z.array(z.string().max(120)).max(1800) }).optional(),
  l2e: z.object({ study: z.unknown(), masteredCaseKeys: z.array(z.string().max(120)).max(1800) }).optional(),
  l3t: z.object({ study: z.unknown(), masteredCaseKeys: z.array(z.string().max(120)).max(1800) }).optional(),
  l3t2: z.object({ study: z.unknown(), masteredCaseKeys: z.array(z.string().max(120)).max(1800) }).optional(),
});
export const roomCodeInput = z.object({ code: z.string().trim().min(4).max(10) });
export const createRoomInput = z.object({ name: z.string().trim().min(2, "Tên phòng cần ít nhất 2 ký tự.").max(80), maxPlayers: z.number().int().min(2).max(16).default(8), format: z.enum(["best_of_3", "ao5", "ao12"]).default("ao5"), eventId: z.enum(TIMER_EVENT_IDS).default(DEFAULT_TIMER_EVENT), multiBlindCubes: z.number().int().min(2).max(99).default(2) });
export const resultInput = roomCodeInput.extend({ roundId: z.number().int().positive(), elapsedMs: z.number().int().min(0).max(3_600_000), inspectionMs: z.number().int().min(0).max(60_000), penalty: z.enum(["none", "+2", "DNF"]), multiBlind: z.object({ attempted: z.number().int().min(2).max(99), solved: z.number().int().min(0).max(99) }).optional() })
  .refine((input) => input.elapsedMs >= MIN_ELAPSED_MS, { message: "Thời gian giải quá ngắn để có thể thật." })
  .refine((input) => input.elapsedMs >= input.inspectionMs, { message: "Thời gian giải không thể ngắn hơn thời gian quan sát." });
export const messageInput = roomCodeInput.extend({ content: z.string().trim().min(1, "Tin nhắn không được để trống.").max(500, "Tin nhắn tối đa 500 ký tự.") });
export const memberTargetInput = roomCodeInput.extend({ accountId: z.number().int().positive() });
export const removeSpectatorInput = memberTargetInput.extend({ reason: z.string().trim().min(3, "Hãy nêu lý do loại người xem (ít nhất 3 ký tự).").max(280, "Lý do tối đa 280 ký tự.") });
export const leaderboardInput = z.object({ period: z.enum(["week", "month"]), eventId: z.enum(TIMER_EVENT_IDS).nullable().optional() });
export const wcaCalendarInput = z.object({ start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải theo YYYY-MM-DD."), end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải theo YYYY-MM-DD."), countryIso2: z.string().trim().length(2).transform((value) => value.toUpperCase()).nullable().optional() });
export const wcaIdInput = z.object({ wcaId: z.string().trim().min(1).max(10).nullable() });
export const wcaCompetitionIdInput = z.object({ id: z.string().trim().regex(/^[A-Za-z0-9]{3,40}$/, "Mã giải không hợp lệ.") });
export const wcaPastInput = z.object({ offset: z.number().int().min(0).max(5000) });
