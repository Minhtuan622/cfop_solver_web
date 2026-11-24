export type CompetitionEventType =
  | "member"
  | "round"
  | "result"
  | "message"
  | "room";

export type CompetitionEvent = { type: CompetitionEventType; at: number };

type Listener = (event: CompetitionEvent) => void;

const listeners = new Map<number, Set<Listener>>();

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
    }
  }
}

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

export function competitionSubscriberCount(roomId: number) {
  return listeners.get(roomId)?.size ?? 0;
}

export const MAX_STREAMS_PER_ACCOUNT = 6;

const streamsByAccount = new Map<number, number>();

export function acquireCompetitionStream(accountId: number): boolean {
  const current = streamsByAccount.get(accountId) ?? 0;
  if (current >= MAX_STREAMS_PER_ACCOUNT) return false;
  streamsByAccount.set(accountId, current + 1);
  return true;
}

export function releaseCompetitionStream(accountId: number) {
  const current = streamsByAccount.get(accountId) ?? 0;
  if (current <= 1) streamsByAccount.delete(accountId);
  else streamsByAccount.set(accountId, current - 1);
}

export function resetCompetitionEventBus() {
  listeners.clear();
  streamsByAccount.clear();
}
