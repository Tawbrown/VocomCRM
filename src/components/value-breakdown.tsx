import { formatCompact } from '@/lib/format';

export interface ValueBreakdownItem {
  label: string;
  value: number;
  count?: number;
  colorClass?: string; // two space-separated classes, e.g. "bg-blue-100 text-blue-700"
}

const DEFAULT_COLOR = 'bg-neutral-100 text-neutral-700';

export function ValueBreakdown({ title, items }: { title: string; items: ValueBreakdownItem[] }) {
  const totalValue = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-medium text-neutral-700">{title}</h3>
      {items.length === 0 || totalValue === 0 ? (
        <p className="text-sm text-neutral-500">No data to show.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const [bgClass, textClass] = (item.colorClass ?? DEFAULT_COLOR).split(' ');
            const widthPct = Math.max((item.value / totalValue) * 100, item.value > 0 ? 3 : 0);
            return (
              <div key={item.label}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-medium text-neutral-700">{item.label}</span>
                  <span className="text-neutral-500">
                    {formatCompact(item.value)}
                    {item.count !== undefined && (
                      <span className="text-neutral-400">
                        {' '}
                        · {item.count} deal{item.count === 1 ? '' : 's'}
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-5 w-full overflow-hidden rounded-md bg-neutral-100">
                  <div
                    className={`flex h-5 items-center justify-end rounded-md ${bgClass} pr-2 transition-all`}
                    style={{ width: `${widthPct}%` }}
                  >
                    {item.value > 0 && (
                      <span className={`text-xs font-semibold ${textClass}`}>{formatCompact(item.value)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
