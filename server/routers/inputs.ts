import { z } from "zod";
import { DEFAULT_TIMER_EVENT, TIMER_EVENT_IDS } from "../../shared/timerEvents";

export const passwordInput = z.string().min(10, "Mật khẩu cần ít nhất 10 ký tự.").max(128, "Mật khẩu quá dài.");
export const credentialsInput = z.object({ email: z.string().trim().email("Email không hợp lệ.").max(320), password: passwordInput });
export const profileInput = z.object({ displayName: z.string().trim().min(2, "Tên hiển thị cần ít nhất 2 ký tự.").max(80), bio: z.string().trim().max(280, "Giới thiệu tối đa 280 ký tự."), goalMs: z.number().int().min(1_000, "Mục tiêu cần ít nhất 1 giây.").max(3_600_000, "Mục tiêu tối đa 60 phút.").nullable() });
export const avatarInput = z.object({ data: z.string().min(8).max(2_800_000), contentType: z.enum(["image/jpeg", "image/png", "image/webp"]) });
export const cloudStateInput = z.object({
  schema: z.literal("cfop-account-cloud-state"),
  version: z.literal(1),
  capturedAt: z.number().int().nonnegative(),
  timer: z.array(z.unknown()).max(500),
  lastLayer: z.object({ study: z.unknown(), masteredCaseKeys: z.array(z.string().max(120)).max(1800) }),
  bldProfile: z.unknown(),
  bldLearningPath: z.unknown(),
});
export const roomCodeInput = z.object({ code: z.string().trim().min(4).max(10) });
export const createRoomInput = z.object({ name: z.string().trim().min(2, "Tên phòng cần ít nhất 2 ký tự.").max(80), maxPlayers: z.number().int().min(2).max(16).default(8), format: z.enum(["best_of_3", "ao5", "ao12"]).default("ao5"), eventId: z.enum(TIMER_EVENT_IDS).default(DEFAULT_TIMER_EVENT), multiBlindCubes: z.number().int().min(2).max(99).default(2) });
export const resultInput = roomCodeInput.extend({ roundId: z.number().int().positive(), elapsedMs: z.number().int().min(0).max(3_600_000), inspectionMs: z.number().int().min(0).max(60_000), penalty: z.enum(["none", "+2", "DNF"]), multiBlind: z.object({ attempted: z.number().int().min(2).max(99), solved: z.number().int().min(0).max(99) }).optional() });
export const messageInput = roomCodeInput.extend({ content: z.string().trim().min(1, "Tin nhắn không được để trống.").max(500, "Tin nhắn tối đa 500 ký tự.") });
export const memberTargetInput = roomCodeInput.extend({ accountId: z.number().int().positive() });
export const removeSpectatorInput = memberTargetInput.extend({ reason: z.string().trim().min(3, "Hãy nêu lý do loại người xem (ít nhất 3 ký tự).").max(280, "Lý do tối đa 280 ký tự.") });
export const leaderboardInput = z.object({ period: z.enum(["week", "month"]), eventId: z.enum(TIMER_EVENT_IDS).nullable().optional() });
export const wcaCalendarInput = z.object({ start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải theo YYYY-MM-DD."), end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải theo YYYY-MM-DD."), countryIso2: z.string().trim().length(2).transform((value) => value.toUpperCase()).nullable().optional() });
export const wcaIdInput = z.object({ wcaId: z.string().trim().min(1).max(10).nullable() });
