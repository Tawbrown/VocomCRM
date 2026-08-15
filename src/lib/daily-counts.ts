// Zero-fills a list of {date, value} points into a complete daily series for the trailing
// `days` window ending today, so gaps show as empty bars instead of missing days. Points
// with the same date are summed. Pass `days: null` for "all time" (from the earliest
// point present, or today if there are none).
export function bucketDaily(points: { date: string; value: number }[], days: number | null) {
  const byDate = new Map<string, number>();
  for (const p of points) {
    const day = p.date.slice(0, 10);
    byDate.set(day, (byDate.get(day) ?? 0) + p.value);
  }

  const today = new Date();
  let start: Date;
  if (days === null) {
    const earliest = points.length > 0 ? points.map((p) => p.date.slice(0, 10)).sort()[0] : today.toISOString().slice(0, 10);
    start = new Date(earliest);
  } else {
    start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
  }

  const series: { date: string; value: number }[] = [];
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, value: byDate.get(key) ?? 0 });
  }
  return series;
}
