'use client';

import { useMemo, useState } from 'react';

interface AggregatedQuery {
  query: string;
  page: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

type SortKey = 'impressions' | 'clicks' | 'position' | 'ctr';

export function QueriesTable({ queries }: { queries: AggregatedQuery[] }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('impressions');
  const [opportunitiesOnly, setOpportunitiesOnly] = useState(false);

  const filtered = useMemo(() => {
    let rows = queries;
    if (opportunitiesOnly) {
      rows = rows.filter((q) => q.impressions >= 20 && q.position >= 8);
    }
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((r) => r.query.toLowerCase().includes(q));
    return [...rows].sort((a, b) => (sortKey === 'position' ? a.position - b.position : b[sortKey] - a[sortKey]));
  }, [queries, search, sortKey, opportunitiesOnly]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search queries..."
          className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm sm:w-64"
        />
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        >
          <option value="impressions">Sort: Impressions</option>
          <option value="clicks">Sort: Clicks</option>
          <option value="position">Sort: Position (best first)</option>
          <option value="ctr">Sort: CTR</option>
        </select>
        <button
          onClick={() => setOpportunitiesOnly((v) => !v)}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            opportunitiesOnly
              ? 'bg-amber-500 text-white'
              : 'bg-white text-amber-600 ring-1 ring-inset ring-amber-200 hover:bg-amber-50'
          }`}
        >
          💡 Opportunities only
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Query</th>
              <th className="px-4 py-3 font-medium">Page</th>
              <th className="px-4 py-3 font-medium">Clicks</th>
              <th className="px-4 py-3 font-medium">Impressions</th>
              <th className="px-4 py-3 font-medium">CTR</th>
              <th className="px-4 py-3 font-medium">Avg Position</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.slice(0, 300).map((row) => (
              <tr
                key={row.query}
                className={row.impressions >= 20 && row.position >= 8 ? 'bg-amber-50/50' : undefined}
              >
                <td className="px-4 py-3 text-neutral-900">{row.query}</td>
                <td className="max-w-[240px] truncate px-4 py-3 text-neutral-500" title={row.page ?? ''}>
                  {row.page || '—'}
                </td>
                <td className="px-4 py-3 text-neutral-600">{row.clicks}</td>
                <td className="px-4 py-3 text-neutral-600">{row.impressions}</td>
                <td className="px-4 py-3 text-neutral-600">{(row.ctr * 100).toFixed(1)}%</td>
                <td className="px-4 py-3 text-neutral-600">{row.position.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-neutral-500">
            No query data yet — check the setup steps below.
          </p>
        )}
      </div>
    </div>
  );
}
