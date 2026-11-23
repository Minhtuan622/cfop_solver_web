import { useEffect } from "react";
import { CFOP_CLOUD_SYNC_EVENT } from "@/lib/cloudSyncSignal";
import { useReviewReminders } from "../lib/useReviewReminders";

/** Thời gian chờ để gom nhiều thay đổi học liên tiếp thành một lần báo lịch. */
const SYNC_DEBOUNCE_MS = 5_000;

/**
 * Chạy nền: khi đã bật nhắc ôn tập thì báo lịch ôn tập cho server lúc mở app và
 * sau mỗi thay đổi dữ liệu học. Không vẽ gì ra giao diện.
 */
export function ReviewReminderSync() {
  const { subscribed, syncSchedule } = useReviewReminders();

  useEffect(() => {
    if (!subscribed) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = (delay: number) => {
      clearTimeout(timer);
      timer = setTimeout(
        () => void syncSchedule().catch(() => undefined),
        delay
      );
    };
    schedule(0);
    const onChange = () => schedule(SYNC_DEBOUNCE_MS);
    const onHide = () => {
      if (document.visibilityState === "hidden") schedule(0);
    };
    window.addEventListener(CFOP_CLOUD_SYNC_EVENT, onChange);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(CFOP_CLOUD_SYNC_EVENT, onChange);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [subscribed, syncSchedule]);

  return null;
}
