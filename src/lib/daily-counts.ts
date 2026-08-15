// Buckets a list of ISO date/timestamp strings into a zero-filled daily series for the
// trailing `days` window — used to feed BarTrend so gaps show as empty bars, not gaps.
export function buildDailyCounts(dates: string[], days: number) {
  const counts = new Map<string, number>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    counts.set(d.toISOString().slice(0, 10), 0);
  }
  for (const raw of dates) {
    const day = raw.slice(0, 10);
    if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return [...counts.entries()].map(([date, value]) => ({ date, value }));
}
