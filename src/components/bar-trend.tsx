export function BarTrend({
  title,
  subtitle,
  data,
  colorClass = 'bg-neutral-800'
}: {
  title: string;
  subtitle?: string;
  data: { date: string; value: number }[];
  colorClass?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-neutral-700">{title}</h3>
        <span className="text-xs text-neutral-400">{subtitle ?? `${total} total`}</span>
      </div>
      {total === 0 ? (
        <p className="text-sm text-neutral-500">No data yet.</p>
      ) : (
        <div className="flex h-24 items-end gap-0.5">
          {data.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${d.value}`}
              className={`flex-1 rounded-t ${colorClass}`}
              style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
