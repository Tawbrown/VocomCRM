import type { LinkedInDailyStat } from '@/lib/types';

export function TrendChart({
  title,
  stats,
  field
}: {
  title: string;
  stats: LinkedInDailyStat[];
  field: 'new_followers' | 'unique_visitors';
}) {
  const recent = stats.slice(-30);
  const max = Math.max(1, ...recent.map((s) => s[field]));
  const total = recent.reduce((sum, s) => sum + s[field], 0);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-neutral-700">{title}</h3>
        <span className="text-xs text-neutral-400">last {recent.length} days · {total} total</span>
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-neutral-500">No data uploaded yet.</p>
      ) : (
        <div className="flex h-24 items-end gap-0.5">
          {recent.map((s) => (
            <div
              key={s.date}
              title={`${s.date}: ${s[field]}`}
              className="flex-1 rounded-t bg-neutral-800"
              style={{ height: `${Math.max(2, (s[field] / max) * 100)}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
