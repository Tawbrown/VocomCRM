'use client';

import { useMemo, useState } from 'react';
import { bucketDaily } from '@/lib/daily-counts';

// A card is only a few hundred px wide — cramming e.g. 365 daily bars into that renders
// each one at sub-pixel width (invisible), even though the data's genuinely there. Once
// the series is longer than this, merge consecutive days together so bars stay visible.
const MAX_BARS = 60;

function resample(series: { date: string; value: number }[]) {
  if (series.length <= MAX_BARS) return series.map((d) => ({ ...d, label: d.date }));
  const chunkSize = Math.ceil(series.length / MAX_BARS);
  const chunks: { date: string; value: number; label: string }[] = [];
  for (let i = 0; i < series.length; i += chunkSize) {
    const chunk = series.slice(i, i + chunkSize);
    const value = chunk.reduce((sum, p) => sum + p.value, 0);
    const from = chunk[0].date;
    const to = chunk[chunk.length - 1].date;
    chunks.push({ date: from, value, label: from === to ? from : `${from} to ${to}` });
  }
  return chunks;
}

const RANGES: { label: string; days: number | null }[] = [
  { label: '1D', days: 1 },
  { label: '7D', days: 7 },
  { label: '1M', days: 30 },
  { label: '1Y', days: 365 },
  { label: 'Max', days: null }
];

// `points` should be the raw (possibly unaggregated) dated values for the widest range
// this chart should ever show — the toggle re-buckets client-side from this same array,
// no extra server round-trip per click.
export function BarTrend({
  title,
  data,
  colorClass = 'bg-neutral-800'
}: {
  title: string;
  data: { date: string; value: number }[];
  colorClass?: string;
}) {
  const [range, setRange] = useState<number | null>(30);
  const [custom, setCustom] = useState<{ from: string; to: string } | null>(null);

  const series = useMemo(() => {
    if (custom) {
      return data
        .filter((p) => p.date.slice(0, 10) >= custom.from && p.date.slice(0, 10) <= custom.to)
        .reduce<{ date: string; value: number }[]>((acc, p) => {
          const day = p.date.slice(0, 10);
          const existing = acc.find((a) => a.date === day);
          if (existing) existing.value += p.value;
          else acc.push({ date: day, value: p.value });
          return acc;
        }, [])
        .sort((a, b) => a.date.localeCompare(b.date));
    }
    return bucketDaily(data, range);
  }, [data, range, custom]);

  const total = series.reduce((sum, d) => sum + d.value, 0);
  const displaySeries = useMemo(() => resample(series), [series]);
  const max = Math.max(1, ...displaySeries.map((d) => d.value));

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-neutral-700">{title}</h3>
        <div className="flex items-center gap-1">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => {
                setRange(r.days);
                setCustom(null);
              }}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                !custom && range === r.days
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              {r.label}
            </button>
          ))}
          <button
            onClick={() =>
              setCustom({
                from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
                to: new Date().toISOString().slice(0, 10)
              })
            }
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              custom ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-100'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {custom && (
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <input
            type="date"
            value={custom.from}
            max={custom.to}
            onChange={(e) => setCustom({ ...custom, from: e.target.value })}
            className="rounded-md border border-neutral-300 px-2 py-1 text-neutral-900"
          />
          <span>to</span>
          <input
            type="date"
            value={custom.to}
            min={custom.from}
            onChange={(e) => setCustom({ ...custom, to: e.target.value })}
            className="rounded-md border border-neutral-300 px-2 py-1 text-neutral-900"
          />
        </div>
      )}

      <p className="mb-2 text-xs text-neutral-400">{total.toLocaleString()} total</p>

      {total === 0 ? (
        <p className="text-sm text-neutral-500">No data in this range.</p>
      ) : (
        <div className="flex h-24 items-end gap-0.5">
          {displaySeries.map((d) => (
            <div
              key={d.date}
              title={`${d.label}: ${d.value}`}
              className={`flex-1 rounded-t ${colorClass}`}
              style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
