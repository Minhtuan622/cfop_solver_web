/**
 * Nhắc ôn tập bằng Web Push.
 *
 * Client tự tính lịch (`nextDueAt`, số case đến hạn) từ dữ liệu học của mình và
 * báo lên qua `push.sync`; server chỉ lưu lịch đó, không đọc payload cloud.
 * Cứ vài phút một lượt quét tìm các đăng ký đã đến hạn và gửi một thông báo
 * cho mỗi đợt hạn. Tính năng tự tắt khi chưa cấu hình khoá VAPID.
 */
import { sendNotification, setVapidDetails } from "web-push";
import {
  deletePushSubscriptionById,
  listDuePushSubscriptions,
  markPushNotified,
} from "../db";

export type VapidConfig = { publicKey: string; privateKey: string; subject: string };

/** Khoảng cách tối thiểu giữa hai thông báo tới cùng một trình duyệt. */
export const MIN_NOTIFY_GAP_MS = 6 * 3_600_000;
/** Giờ yên lặng theo múi giờ của trình duyệt: [22:00, 08:00). */
const QUIET_START_HOUR = 22;
const QUIET_END_HOUR = 8;
export const SWEEP_INTERVAL_MS = 5 * 60_000;

/** Đọc khoá VAPID từ môi trường; `null` nghĩa là tính năng chưa bật. */
export function readVapidConfig(
  env: Record<string, string | undefined> = process.env
): VapidConfig | null {
  const publicKey = env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = env.VAPID_PRIVATE_KEY?.trim();
  const subject = env.VAPID_SUBJECT?.trim();
  if (!publicKey || !privateKey || !subject) return null;
  if (!/^(mailto:|https:\/\/)/.test(subject)) return null;
  return { publicKey, privateKey, subject };
}

/** Các dịch vụ push của trình duyệt phổ biến; endpoint lạ bị từ chối để tránh SSRF. */
const PUSH_HOST_SUFFIXES = [
  "fcm.googleapis.com",
  "push.services.mozilla.com",
  "push.apple.com",
  "notify.windows.com",
];

export function isAllowedPushEndpoint(endpoint: string) {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password) return false;
  if (url.port && url.port !== "443") return false;
  const host = url.hostname.toLowerCase();
  return PUSH_HOST_SUFFIXES.some(
    suffix => host === suffix || host.endsWith(`.${suffix}`)
  );
}

/** Giờ địa phương của trình duyệt nằm trong khung yên lặng ban đêm? */
export function isQuietHour(now: number, tzOffsetMinutes: number) {
  // getTimezoneOffset() dương khi múi giờ nằm phía tây UTC: local = utc - offset.
  const hour = new Date(now - tzOffsetMinutes * 60_000).getUTCHours();
  return hour >= QUIET_START_HOUR || hour < QUIET_END_HOUR;
}

export type PushTarget = {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  tzOffsetMinutes: number;
  dueCount: number;
  lastNotifiedAt: number | null;
};

export type PushSender = (target: PushTarget) => Promise<void>;

export type SweepResult = { sent: number; skipped: number; removed: number };

/**
 * Một lượt quét: gửi cho các đăng ký đến hạn. Đăng ký bị dịch vụ push báo đã
 * hết hiệu lực (404/410) thì xoá. `send` được truyền vào để kiểm thử.
 */
export async function runReminderSweep(
  send: PushSender,
  now = Date.now()
): Promise<SweepResult> {
  const result: SweepResult = { sent: 0, skipped: 0, removed: 0 };
  for (const row of await listDuePushSubscriptions(now)) {
    const target: PushTarget = {
      id: row.id,
      endpoint: row.endpoint,
      p256dh: row.p256dh,
      auth: row.auth,
      tzOffsetMinutes: row.tzOffsetMinutes,
      dueCount: row.dueCount,
      lastNotifiedAt: row.lastNotifiedAt,
    };
    if (
      isQuietHour(now, target.tzOffsetMinutes) ||
      (target.lastNotifiedAt !== null &&
        now - target.lastNotifiedAt < MIN_NOTIFY_GAP_MS)
    ) {
      result.skipped += 1;
      continue;
    }
    try {
      await send(target);
      await markPushNotified(target.id, now);
      result.sent += 1;
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await deletePushSubscriptionById(target.id);
        result.removed += 1;
      } else {
        // Lỗi tạm thời: giữ nguyên, lượt quét sau thử lại.
        result.skipped += 1;
      }
    }
  }
  return result;
}

/** Bộ gửi thật dựa trên `web-push`. Nội dung chỉ có loại và số case; client tự soạn câu chữ. */
export function createWebPushSender(config: VapidConfig): PushSender {
  setVapidDetails(config.subject, config.publicKey, config.privateKey);
  return async target => {
    await sendNotification(
      {
        endpoint: target.endpoint,
        keys: { p256dh: target.p256dh, auth: target.auth },
      },
      JSON.stringify({ kind: "review-due", count: target.dueCount, url: "/study" }),
      { TTL: 12 * 3600, urgency: "low" }
    );
  };
}

/** Chạy lượt quét định kỳ; trả về hàm dừng, hoặc `null` khi chưa cấu hình VAPID. */
export function startReminderScheduler(
  config = readVapidConfig(),
  intervalMs = SWEEP_INTERVAL_MS
): (() => void) | null {
  if (!config) return null;
  const send = createWebPushSender(config);
  let running = false;
  const timer = setInterval(() => {
    if (running) return;
    running = true;
    runReminderSweep(send)
      .catch(error => console.warn("[Push] Sweep failed:", error))
      .finally(() => {
        running = false;
      });
  }, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}
