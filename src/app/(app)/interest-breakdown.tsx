const COLORS: Record<string, string> = {
  Interested: 'bg-green-500',
  'Meeting Booked': 'bg-purple-500',
  'Meeting Completed': 'bg-purple-500',
  Won: 'bg-green-500',
  'Out of Office': 'bg-amber-500',
  'Not Interested': 'bg-red-400',
  'Wrong Person': 'bg-red-400',
  Lost: 'bg-red-400',
  'No Show': 'bg-red-400',
  Uncontacted: 'bg-neutral-300'
};

export function InterestBreakdown({ counts }: { counts: { label: string; count: number }[] }) {
  const total = counts.reduce((sum, c) => sum + c.count, 0) || 1;
  const nonZero = counts.filter((c) => c.count > 0);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-medium text-neutral-700">Instantly leads by status</h3>
      {nonZero.length === 0 ? (
        <p className="text-sm text-neutral-500">No leads yet.</p>
      ) : (
        <div className="space-y-2">
          {nonZero.map((c) => (
            <div key={c.label}>
              <div className="mb-0.5 flex justify-between text-xs text-neutral-600">
                <span>{c.label}</span>
                <span className="text-neutral-400">{c.count}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-2 rounded-full ${COLORS[c.label] ?? 'bg-neutral-400'}`}
                  style={{ width: `${(c.count / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
