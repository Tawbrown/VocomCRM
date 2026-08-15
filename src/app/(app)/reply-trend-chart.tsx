export function ReplyTrendChart({ dailyCounts }: { dailyCounts: { date: string; count: number }[] }) {
  const max = Math.max(1, ...dailyCounts.map((d) => d.count));
  const total = dailyCounts.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-neutral-700">Replies received</h3>
        <span className="text-xs text-neutral-400">last 90 days · {total} total</span>
      </div>
      {total === 0 ? (
        <p className="text-sm text-neutral-500">No replies logged yet.</p>
      ) : (
        <div className="flex h-28 items-end gap-0.5">
          {dailyCounts.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${d.count}`}
              className="flex-1 rounded-t bg-red-500/80"
              style={{ height: `${Math.max(2, (d.count / max) * 100)}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
