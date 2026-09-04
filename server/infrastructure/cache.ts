type CacheEntry<T> = {
  value?: T;
  pending?: Promise<T>;
  expiresAt: number;
  touchedAt: number;
};

export type CacheOptions = {
  ttlMs: number;
  maxEntries?: number;
};

export class TtlCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();
  private readonly maxEntries: number;

  constructor(private readonly options: CacheOptions) {
    this.maxEntries = Math.max(1, options.maxEntries ?? 128);
  }

  get(key: string, now = Date.now()): T | undefined {
    const entry = this.entries.get(key);
    if (!entry || entry.pending || entry.expiresAt <= now) {
      if (entry && !entry.pending && entry.expiresAt <= now) this.entries.delete(key);
      return undefined;
    }
    entry.touchedAt = now;
    return entry.value;
  }

  async getOrSet(key: string, load: () => Promise<T>, now = Date.now()): Promise<T> {
    const cached = this.get(key, now);
    if (cached !== undefined) return cached;

    const existing = this.entries.get(key)?.pending;
    if (existing) return existing;

    const pending = load().then((value) => {
      const timestamp = Date.now();
      this.entries.set(key, { value, expiresAt: timestamp + this.options.ttlMs, touchedAt: timestamp });
      this.evictIfNeeded();
      return value;
    }).catch((error) => {
      this.entries.delete(key);
      throw error;
    });
    this.entries.set(key, { pending, expiresAt: Number.POSITIVE_INFINITY, touchedAt: now });
    return pending;
  }

  invalidate(key?: string) {
    if (key === undefined) this.entries.clear();
    else this.entries.delete(key);
  }

  stats() {
    return { size: this.entries.size, keys: Array.from(this.entries.keys()) };
  }

  private evictIfNeeded() {
    while (this.entries.size > this.maxEntries) {
      const oldest = Array.from(this.entries.entries()).sort(([, left], [, right]) => left.touchedAt - right.touchedAt)[0];
      if (!oldest) return;
      this.entries.delete(oldest[0]);
    }
  }
}

export function cacheKey(parts: readonly (string | number | null | undefined)[]) {
  return parts.map((part) => `${String(part ?? "").length}:${String(part ?? "")}`).join("|");
}
