import { useEffect, useRef, useState } from "react";

/** Polling khi chưa có kênh realtime (mất kết nối hoặc trình duyệt không hỗ trợ). */
export const ROOM_POLL_FALLBACK_MS = 2_500;
/** Polling dự phòng khi kênh realtime đang sống; chỉ để vá sự kiện bị lỡ. */
export const ROOM_POLL_LIVE_MS = 30_000;

/** Khoảng polling tương ứng với trạng thái kênh realtime. */
export function roomPollInterval(live: boolean) {
  return live ? ROOM_POLL_LIVE_MS : ROOM_POLL_FALLBACK_MS;
}

/**
 * Theo dõi phòng qua Server-Sent Events. `onChange` được gọi mỗi khi server
 * báo phòng đổi (bên gọi tải lại `competition.state`). Trả về `true` khi kênh
 * đang mở, để bên gọi hạ tần suất polling.
 */
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
      // Có thể đã lỡ thay đổi trong lúc kết nối lại.
      handler.current();
    });
    source.addEventListener("change", () => handler.current());
    source.addEventListener("closed", () => {
      setLive(false);
      source.close();
      handler.current();
    });
    // Lỗi tạm thời: EventSource tự nối lại; trong lúc đó polling nhanh chạy.
    source.onerror = () => setLive(false);
    return () => {
      source.close();
      setLive(false);
    };
  }, [code, enabled]);

  return live;
}
