'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { STATUS_COLORS } from '@/components/status-select';
import { ValueBreakdown } from '@/components/value-breakdown';
import { formatCompact } from '@/lib/format';
import { quarterLabel } from '@/lib/quarter';
import { DIVISIONS, type Account, type Deal, type DealPipelineStatus } from '@/lib/types';

const OPEN_STATUSES: DealPipelineStatus[] = ['Prospecting', 'Proposal', 'Negotiation'];

// Fibre is build-to-order with 6-10 week lead times — an open deal that hasn't changed
// stage in that window is worth a rep's attention before it's actually stalled.
const STALE_DAYS_THRESHOLD = 42;

function daysInStage(stageChangedAt: string): number {
  return Math.floor((Date.now() - new Date(stageChangedAt).getTime()) / (24 * 60 * 60 * 1000));
}

const PROBABILITY_BY_STATUS: Partial<Record<DealPipelineStatus, number>> = {
  Prospecting: 0.2,
  Proposal: 0.5,
  Negotiation: 0.75
};

export function SalesDashboardClient({ deals, accounts }: { deals: Deal[]; accounts: Account[] }) {
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const filteredDeals = useMemo(() => {
    let rows = deals;
    if (divisionFilter !== 'all') rows = rows.filter((d) => d.division === divisionFilter);
    if (dateFrom) rows = rows.filter((d) => d.start_date >= dateFrom);
    if (dateTo) rows = rows.filter((d) => d.start_date <= dateTo);
    return rows;
  }, [deals, divisionFilter, dateFrom, dateTo]);

  // #1 Sales by Quarter — Won only, excluding the known 2024-01-01 placeholder date
  const quarterBreakdown = useMemo(() => {
    const won = filteredDeals.filter((d) => d.status === 'Won');
    const excluded = won.filter((d) => d.start_date === '2024-01-01');
    const included = won.filter((d) => d.start_date !== '2024-01-01');

    const byQuarter = new Map<string, { value: number; count: number }>();
    for (const d of included) {
      const q = quarterLabel(d.start_date);
      const bucket = byQuarter.get(q) ?? { value: 0, count: 0 };
      bucket.value += d.value;
      bucket.count += 1;
      byQuarter.set(q, bucket);
    }
    const items = [...byQuarter.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, { value, count }]) => ({ label, value, count, colorClass: 'bg-green-100 text-green-700' }));

    return {
      items,
      title: `Closed Won Revenue by Quarter (${excluded.length} deal(s) excluded — no reliable close date)`
    };
  }, [filteredDeals]);

  // #2 Potential Sales by Stage
  const stageBreakdown = useMemo(
    () =>
      OPEN_STATUSES.map((status) => {
        const rows = filteredDeals.filter((d) => d.status === status);
        return {
          label: status,
          value: rows.reduce((s, d) => s + d.value, 0),
          count: rows.length,
          colorClass: STATUS_COLORS[status]
        };
      }),
    [filteredDeals]
  );

  // #3 / #4 metric tiles
  const totalSales = useMemo(
    () => filteredDeals.filter((d) => d.status === 'Won').reduce((s, d) => s + d.value, 0),
    [filteredDeals]
  );
  const totalPotentialSales = useMemo(
    () => filteredDeals.filter((d) => OPEN_STATUSES.includes(d.status)).reduce((s, d) => s + d.value, 0),
    [filteredDeals]
  );

  // #5 Region breakdown — Won + Open, Lost excluded
  const regionBreakdown = useMemo(() => {
    const rows = filteredDeals.filter((d) => d.status !== 'Lost');
    const byRegion = new Map<string, { value: number; count: number }>();
    for (const d of rows) {
      const account = d.account_id ? accountById.get(d.account_id) : undefined;
      const region = account?.region ?? 'Unset';
      const bucket = byRegion.get(region) ?? { value: 0, count: 0 };
      bucket.value += d.value;
      bucket.count += 1;
      byRegion.set(region, bucket);
    }
    return [...byRegion.entries()]
      .sort(([, a], [, b]) => b.value - a.value)
      .map(([label, { value, count }]) => ({
        label,
        value,
        count,
        colorClass: STATUS_COLORS[label] ?? 'bg-neutral-100 text-neutral-700'
      }));
  }, [filteredDeals, accountById]);

  // #6 Lead Source breakdown — same Won + Open, Lost excluded filter
  const sourceBreakdown = useMemo(() => {
    const rows = filteredDeals.filter((d) => d.status !== 'Lost');
    const bySource = new Map<string, { value: number; count: number }>();
    for (const d of rows) {
      const source = d.source ?? 'Not recorded';
      const bucket = bySource.get(source) ?? { value: 0, count: 0 };
      bucket.value += d.value;
      bucket.count += 1;
      bySource.set(source, bucket);
    }
    return [...bySource.entries()]
      .sort(([, a], [, b]) => b.value - a.value)
      .map(([label, { value, count }]) => ({
        label,
        value,
        count,
        colorClass: STATUS_COLORS[label] ?? 'bg-neutral-100 text-neutral-700'
      }));
  }, [filteredDeals]);

  // Stalled deals — open deals sitting in their current stage longer than fibre's own
  // 6-10 week build-to-order window, worst first, capped at 10 so this stays a punch
  // list rather than a duplicate of the full table.
  const stalledDeals = useMemo(
    () =>
      filteredDeals
        .filter((d) => OPEN_STATUSES.includes(d.status))
        .map((d) => ({ deal: d, days: daysInStage(d.stage_changed_at) }))
        .filter(({ days }) => days > STALE_DAYS_THRESHOLD)
        .sort((a, b) => b.days - a.days)
        .slice(0, 10),
    [filteredDeals]
  );

  // #7 Expected Revenue by Account — Open deals, probability-weighted
  const expectedRevenueByAccount = useMemo(() => {
    const open = filteredDeals.filter((d) => d.status in PROBABILITY_BY_STATUS);
    const byAccount = new Map<string, { value: number; count: number }>();
    for (const d of open) {
      const probability = PROBABILITY_BY_STATUS[d.status] ?? 0;
      const account = d.account_id ? accountById.get(d.account_id) : undefined;
      const name = account?.name ?? d.company ?? 'Unknown account';
      const bucket = byAccount.get(name) ?? { value: 0, count: 0 };
      bucket.value += d.value * probability;
      bucket.count += 1;
      byAccount.set(name, bucket);
    }
    return [...byAccount.entries()]
      .sort(([, a], [, b]) => b.value - a.value)
      .map(([label, { value, count }]) => ({ label, value, count }));
  }, [filteredDeals, accountById]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-neutral-500">
          Division
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-700"
          >
            <option value="all">All</option>
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-neutral-500">
          Start date from
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-700"
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-neutral-500">
          to
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-700"
          />
        </label>
      </div>

      <div className="mb-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h3 className="mb-1 text-sm font-medium text-neutral-700">
          Stalled Deals (open, no stage change in {STALE_DAYS_THRESHOLD}+ days)
        </h3>
        {stalledDeals.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No open deal has sat in its current stage past {STALE_DAYS_THRESHOLD} days — pipeline looks healthy.
          </p>
        ) : (
          <div className="mt-2 divide-y divide-neutral-100">
            {stalledDeals.map(({ deal, days }) => (
              <Link
                key={deal.id}
                href={`/deals?id=${deal.id}`}
                className="flex items-center justify-between gap-3 py-2 text-sm hover:bg-neutral-50"
              >
                <span className="font-medium text-neutral-900">{deal.customer_name}</span>
                <span className="text-neutral-500">{deal.status}</span>
                <span className={days > 70 ? 'font-semibold text-red-600' : 'font-medium text-amber-600'}>{days}d</span>
                <span className="text-neutral-500">{formatCompact(deal.value)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ValueBreakdown title={quarterBreakdown.title} items={quarterBreakdown.items} />
        <ValueBreakdown title="Open Pipeline by Stage" items={stageBreakdown} />
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-neutral-500">Total Sales</p>
            <p className="mt-1 text-3xl font-semibold text-neutral-900">{formatCompact(totalSales)}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-neutral-500">Total Potential Sales</p>
            <p className="mt-1 text-3xl font-semibold text-neutral-900">{formatCompact(totalPotentialSales)}</p>
          </div>
        </div>

        <ValueBreakdown title="Won + Open Pipeline Value by Region (Lost excluded)" items={regionBreakdown} />
        <div>
          <ValueBreakdown title="Won + Open Pipeline Value by Lead Source (Lost excluded)" items={sourceBreakdown} />
          <p className="mt-1 text-xs text-neutral-400">
            Most deals currently show &quot;Not recorded&quot; — lead source wasn&apos;t captured on
            deals created before this feature; new deals will populate it going forward.
          </p>
        </div>
        <ValueBreakdown
          title="Expected Revenue by Account (Open deals; probability estimated from stage — Prospecting 20% · Proposal 50% · Negotiation 75%)"
          items={expectedRevenueByAccount}
        />
      </div>
    </div>
  );
}
