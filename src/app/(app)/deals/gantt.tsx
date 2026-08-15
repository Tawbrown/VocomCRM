import type { Deal } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  Prospecting: 'bg-neutral-400',
  Proposal: 'bg-blue-500',
  Negotiation: 'bg-amber-500',
  Won: 'bg-green-500',
  Lost: 'bg-red-400'
};

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatShort(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function Gantt({ deals }: { deals: Deal[] }) {
  if (deals.length === 0) {
    return <p className="text-sm text-neutral-500">No deals yet — add one below.</p>;
  }

  const today = new Date();
  const starts = deals.map((d) => new Date(d.start_date));
  const ends = deals.map((d) => new Date(d.expected_close_date ?? addDays(new Date(d.start_date), 30)));

  const rangeStart = addDays(new Date(Math.min(...starts.map((d) => d.getTime()), today.getTime())), -3);
  const rangeEnd = addDays(new Date(Math.max(...ends.map((d) => d.getTime()), today.getTime())), 3);
  const totalMs = rangeEnd.getTime() - rangeStart.getTime() || 1;

  const pct = (d: Date) => ((d.getTime() - rangeStart.getTime()) / totalMs) * 100;
  const todayPct = pct(today);

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex justify-between text-xs text-neutral-400">
        <span>{formatShort(rangeStart)}</span>
        <span>Today: {formatShort(today)}</span>
        <span>{formatShort(rangeEnd)}</span>
      </div>
      <div className="min-w-[600px] space-y-2">
        {deals.map((deal) => {
          const start = new Date(deal.start_date);
          const end = new Date(deal.expected_close_date ?? addDays(start, 30));
          const left = pct(start);
          const width = Math.max(1.5, pct(end) - left);
          return (
            <div key={deal.id} className="relative h-9">
              <div className="absolute inset-0 flex items-center">
                <div className="h-1.5 w-full rounded-full bg-neutral-100" />
              </div>
              <div
                className="absolute h-1.5 w-px bg-neutral-300"
                style={{ left: `${todayPct}%`, top: '50%', height: '28px', transform: 'translateY(-50%)' }}
              />
              <div
                className={`group absolute top-1/2 flex h-6 -translate-y-1/2 items-center rounded-md px-2 text-xs font-medium text-white shadow-sm ${
                  STATUS_COLORS[deal.status] ?? 'bg-neutral-400'
                }`}
                style={{ left: `${left}%`, width: `${width}%`, minWidth: '90px' }}
                title={`${deal.customer_name} — ${deal.status} — $${deal.value.toLocaleString()}`}
              >
                <span className="truncate">{deal.customer_name}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-neutral-500">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            {status}
          </span>
        ))}
      </div>
    </div>
  );
}
