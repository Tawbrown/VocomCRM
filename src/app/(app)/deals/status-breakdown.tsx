import { STATUS_COLORS } from '@/components/status-select';
import { DEAL_PIPELINE_STATUSES, type Deal } from '@/lib/types';

function currency(n: number) {
  return `$${n.toLocaleString()}`;
}

export function StatusBreakdown({ deals }: { deals: Deal[] }) {
  if (deals.length === 0) {
    return <p className="text-sm text-neutral-500">No deals yet — add one below.</p>;
  }

  const byStatus = DEAL_PIPELINE_STATUSES.map((status) => {
    const rows = deals.filter((d) => d.status === status);
    return { status, count: rows.length, value: rows.reduce((sum, d) => sum + d.value, 0) };
  });
  const totalValue = byStatus.reduce((sum, s) => sum + s.value, 0) || 1;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-medium text-neutral-700">Pipeline by Status</h3>
      <div className="space-y-3">
        {byStatus.map(({ status, count, value }) => {
          const [bgClass, textClass] = (STATUS_COLORS[status] ?? 'bg-neutral-100 text-neutral-700').split(' ');
          const widthPct = Math.max((value / totalValue) * 100, value > 0 ? 3 : 0);
          return (
            <div key={status}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="font-medium text-neutral-700">{status}</span>
                <span className="text-neutral-500">
                  {currency(value)}{' '}
                  <span className="text-neutral-400">
                    · {count} deal{count === 1 ? '' : 's'}
                  </span>
                </span>
              </div>
              <div className="h-5 w-full overflow-hidden rounded-md bg-neutral-100">
                <div
                  className={`flex h-5 items-center justify-end rounded-md ${bgClass} pr-2 transition-all`}
                  style={{ width: `${widthPct}%` }}
                >
                  {value > 0 && <span className={`text-xs font-semibold ${textClass}`}>{currency(value)}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
