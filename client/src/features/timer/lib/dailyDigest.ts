export function dayKey(ms: number): string {
  const date = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export type DailyDigest = {
  todayCount: number;
  streak: number;
};

export function dailyDigest(
  entries: ReadonlyArray<{ createdAt: number }>
): DailyDigest {
  const days = new Set(entries.map(entry => dayKey(entry.createdAt)));
  const today = dayKey(Date.now());
  const todayCount = entries.filter(entry => dayKey(entry.createdAt) === today).length;

  let streak = 0;
  if (days.has(today)) {
    const cursor = new Date();
    while (days.has(dayKey(cursor.getTime()))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  } else {
    const cursor = new Date();
    cursor.setDate(cursor.getDate() - 1);
    while (days.has(dayKey(cursor.getTime()))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  return { todayCount, streak };
}
