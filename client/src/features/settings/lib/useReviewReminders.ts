import { useCallback, useEffect, useState } from "react";
import { createCfopCloudState } from "@/lib/cloudSync";
import { reviewSchedule } from "@/lib/reviewSchedule";
import { trpc } from "@/lib/trpc";

/**
 * `unsupported`: trình duyệt không có Web Push · `signedOut`: chưa đăng nhập ·
 * `unavailable`: máy chủ chưa cấu hình VAPID · `denied`: người dùng chặn quyền
 * thông báo · `off`/`on`: tắt/bật · `checking`: đang kiểm tra.
 */
export type ReminderStatus =
  | "checking"
  | "unsupported"
  | "signedOut"
  | "unavailable"
  | "denied"
  | "off"
  | "on";

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** VAPID public key (base64url) → Uint8Array cho `pushManager.subscribe`. */
export function urlBase64ToBytes(value: string) {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, char => char.charCodeAt(0));
}

/** Lịch ôn tập hiện tại từ mọi lane học trên máy này. */
export function readCurrentReviewSchedule(now = Date.now()) {
  const state = createCfopCloudState(now);
  const lanes = [
    state.lastLayer,
    state.twoByTwo,
    state.pyraminx,
    state.skewb,
    state.sq1,
    state.parity,
    state.l2e,
    state.l3t,
    state.l3t2,
  ];
  return reviewSchedule(lanes, now);
}

async function currentSubscription() {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

/** Bật/tắt nhắc ôn tập và đồng bộ lịch lên server. */
export function useReviewReminders() {
  const account = trpc.cfopAccount.me.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  });
  const config = trpc.push.config.useQuery(undefined, {
    staleTime: 300_000,
    retry: false,
  });
  const subscribe = trpc.push.subscribe.useMutation();
  const sync = trpc.push.sync.useMutation();
  const unsubscribe = trpc.push.unsubscribe.useMutation();
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const supported = pushSupported();
  const signedIn = Boolean(account.data);
  const serverReady = Boolean(config.data?.enabled);

  useEffect(() => {
    if (!supported || !signedIn || !serverReady) return;
    let cancelled = false;
    setDenied(Notification.permission === "denied");
    currentSubscription()
      .then(sub => {
        if (!cancelled) setSubscribed(Boolean(sub));
      })
      .catch(() => {
        if (!cancelled) setSubscribed(false);
      });
    return () => {
      cancelled = true;
    };
  }, [supported, signedIn, serverReady]);

  const syncSchedule = useCallback(async () => {
    const sub = await currentSubscription();
    if (!sub) return;
    const schedule = readCurrentReviewSchedule();
    const result = await sync.mutateAsync({
      endpoint: sub.endpoint,
      nextDueAt: schedule.nextDueAt,
      dueCount: schedule.dueCount,
      tzOffsetMinutes: new Date().getTimezoneOffset(),
    });
    // Server không còn biết đăng ký này: coi như tắt để người dùng bật lại.
    if (!result.subscribed) setSubscribed(false);
  }, [sync]);

  const enable = useCallback(async () => {
    setError(null);
    try {
      const publicKey = config.data?.publicKey;
      if (!publicKey) return;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setDenied(permission === "denied");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const sub =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToBytes(publicKey),
        }));
      const json = sub.toJSON();
      await subscribe.mutateAsync({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        tzOffsetMinutes: new Date().getTimezoneOffset(),
      });
      setSubscribed(true);
      await syncSchedule();
    } catch (next) {
      setError(next);
    }
  }, [config.data?.publicKey, subscribe, syncSchedule]);

  const disable = useCallback(async () => {
    setError(null);
    try {
      const sub = await currentSubscription();
      if (sub) {
        await unsubscribe
          .mutateAsync({ endpoint: sub.endpoint })
          .catch(() => undefined);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (next) {
      setError(next);
    }
  }, [unsubscribe]);

  const status: ReminderStatus = !supported
    ? "unsupported"
    : account.isLoading || config.isLoading
      ? "checking"
      : !signedIn
        ? "signedOut"
        : !serverReady
          ? "unavailable"
          : denied
            ? "denied"
            : subscribed === null
              ? "checking"
              : subscribed
                ? "on"
                : "off";

  return {
    status,
    busy: subscribe.isPending || unsubscribe.isPending,
    error,
    enable,
    disable,
    syncSchedule,
    subscribed: status === "on",
  };
}
