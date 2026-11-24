import { useEffect, useRef, useState } from "react";

export const ROOM_POLL_FALLBACK_MS = 2_500;
export const ROOM_POLL_LIVE_MS = 30_000;

export function roomPollInterval(live: boolean) {
  return live ? ROOM_POLL_LIVE_MS : ROOM_POLL_FALLBACK_MS;
}

export function useRoomEvents(
  code: string,
  enabled: boolean,
  onChange: () => void
) {
  const [live, setLive] = useState(false);
  const handler = useRef(onChange);
  handler.current = onChange;

  useEffect(() => {
    if (!enabled || !code || typeof EventSource === "undefined") {
      setLive(false);
      return;
    }
    const source = new EventSource(
      `/api/competition/events?code=${encodeURIComponent(code)}`,
      { withCredentials: true }
    );
    source.addEventListener("ready", () => {
      setLive(true);
      handler.current();
    });
    source.addEventListener("change", () => handler.current());
    source.addEventListener("closed", () => {
      setLive(false);
      source.close();
      handler.current();
    });
    source.onerror = () => setLive(false);
    return () => {
      source.close();
      setLive(false);
    };
  }, [code, enabled]);

  return live;
}
