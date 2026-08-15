export function BreakdownBars({
  title,
  items
}: {
  title: string;
  items: { label: string; count: number; colorClass?: string }[];
}) {
  const total = items.reduce((sum, i) => sum + i.count, 0) || 1;
  const nonZero = items.filter((i) => i.count > 0);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-medium text-neutral-700">{title}</h3>
      {nonZero.length === 0 ? (
        <p className="text-sm text-neutral-500">No data yet.</p>
      ) : (
        <div className="space-y-2">
          {nonZero.map((item) => (
            <div key={item.label}>
              <div className="mb-0.5 flex justify-between text-xs text-neutral-600">
                <span>{item.label}</span>
                <span className="text-neutral-400">{item.count}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-2 rounded-full ${item.colorClass ?? 'bg-neutral-800'}`}
                  style={{ width: `${(item.count / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
