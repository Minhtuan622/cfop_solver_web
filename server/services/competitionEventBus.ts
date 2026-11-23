/**
 * Bus sự kiện phòng thi trong bộ nhớ của tiến trình Node.
 *
 * Kênh realtime chỉ báo phòng vừa thay đổi để client tải lại
 * `competition.state`; dữ liệu thật (thành viên, kết quả, tin nhắn) vẫn nằm ở
 * database và đi qua tRPC. Vì sự kiện không mang nội dung nên không có gì để
 * lộ ra qua kênh này.
 *
 * Giới hạn đã biết: bus chỉ phát trong một tiến trình. Khi chạy nhiều
 * instance Node cần Redis Pub/Sub (xem `docs/development/project-guide.md`
 * §15, giai đoạn 2); lúc đó client vẫn nhận thay đổi nhờ polling dự phòng.
 */

/** Loại thay đổi của một phòng. */
export type CompetitionEventType =
  /** Có người vào, rời, được cấp/gỡ quyền hoặc bị loại. */
  | "member"
  /** Lượt thi mở hoặc đóng. */
  | "round"
  /** Có người nộp kết quả. */
  | "result"
  /** Có tin nhắn mới. */
  | "message"
  /** Phòng bị xoá hoặc kết thúc. */
  | "room";

export type CompetitionEvent = { type: CompetitionEventType; at: number };

type Listener = (event: CompetitionEvent) => void;

const listeners = new Map<number, Set<Listener>>();

/** Phát một sự kiện tới mọi kết nối đang theo dõi phòng. */
export function publishCompetitionEvent(
  roomId: number,
  type: CompetitionEventType
) {
  const subscribers = listeners.get(roomId);
  if (!subscribers?.size) return;
  const event: CompetitionEvent = { type, at: Date.now() };
  for (const listener of Array.from(subscribers)) {
    try {
      listener(event);
    } catch {
      /* một kết nối hỏng không được chặn các kết nối còn lại. */
    }
  }
}

/** Theo dõi một phòng; trả về hàm huỷ theo dõi. */
export function subscribeCompetitionEvents(
  roomId: number,
  listener: Listener
): () => void {
  let subscribers = listeners.get(roomId);
  if (!subscribers) {
    subscribers = new Set();
    listeners.set(roomId, subscribers);
  }
  subscribers.add(listener);
  return () => {
    const current = listeners.get(roomId);
    if (!current) return;
    current.delete(listener);
    if (!current.size) listeners.delete(roomId);
  };
}

/** Số kết nối đang theo dõi một phòng (dùng cho kiểm thử và giám sát). */
export function competitionSubscriberCount(roomId: number) {
  return listeners.get(roomId)?.size ?? 0;
}

/** Số kết nối tối đa của một tài khoản (nhiều tab, không phải vô hạn). */
export const MAX_STREAMS_PER_ACCOUNT = 6;

const streamsByAccount = new Map<number, number>();

/** Giữ một chỗ cho kết nối của tài khoản; `false` khi đã đạt giới hạn. */
export function acquireCompetitionStream(accountId: number): boolean {
  const current = streamsByAccount.get(accountId) ?? 0;
  if (current >= MAX_STREAMS_PER_ACCOUNT) return false;
  streamsByAccount.set(accountId, current + 1);
  return true;
}

/** Trả lại chỗ đã giữ khi kết nối đóng. */
export function releaseCompetitionStream(accountId: number) {
  const current = streamsByAccount.get(accountId) ?? 0;
  if (current <= 1) streamsByAccount.delete(accountId);
  else streamsByAccount.set(accountId, current - 1);
}

/** Xoá toàn bộ trạng thái (dùng khi kiểm thử). */
export function resetCompetitionEventBus() {
  listeners.clear();
  streamsByAccount.clear();
}
