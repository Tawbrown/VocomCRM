import type { LinkedInAudienceStat } from '@/lib/types';

const CATEGORIES = ['Location', 'Job function', 'Seniority', 'Industry', 'Company size'];

export function AudienceBreakdown({
  stats,
  source
}: {
  stats: LinkedInAudienceStat[];
  source: 'followers' | 'visitors';
}) {
  const filtered = stats.filter((s) => s.source === source);
  if (filtered.length === 0) {
    return <p className="text-sm text-neutral-500">No {source} demographic data uploaded yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {CATEGORIES.map((category) => {
        const rows = filtered
          .filter((s) => s.category === category)
          .sort((a, b) => b.value - a.value)
          .slice(0, 8);
        if (rows.length === 0) return null;
        const max = Math.max(1, ...rows.map((r) => r.value));

        return (
          <div key={category} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h4 className="mb-3 text-sm font-medium text-neutral-700">{category}</h4>
            <div className="space-y-2">
              {rows.map((row) => (
                <div key={row.label} className="text-xs">
                  <div className="mb-0.5 flex justify-between text-neutral-600">
                    <span className="truncate pr-2">{row.label}</span>
                    <span className="shrink-0 text-neutral-400">{row.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-neutral-100">
                    <div
                      className="h-1.5 rounded-full bg-neutral-800"
                      style={{ width: `${(row.value / max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
