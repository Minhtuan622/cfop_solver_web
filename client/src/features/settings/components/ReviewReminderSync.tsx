import { useEffect } from "react";
import { CFOP_CLOUD_SYNC_EVENT } from "@/lib/cloudSyncSignal";
import { useReviewReminders } from "../lib/useReviewReminders";

const SYNC_DEBOUNCE_MS = 5_000;

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
