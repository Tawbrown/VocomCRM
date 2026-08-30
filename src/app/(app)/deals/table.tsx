'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTransition } from 'react';
import { bulkUpdateDeals, createAccountFromDeal, deleteDeal, updateDeal } from '@/app/actions';
import { AccountSelect } from '@/components/account-select';
import { DeleteButton } from '@/components/delete-button';
import { NotesButton } from '@/components/notes-button';
import { RepSelect } from '@/components/rep-select';
import { StatusSelect } from '@/components/status-select';
import { buildCsv, downloadCsv } from '@/lib/csv-export';
import { DEAL_PIPELINE_STATUSES, type Account, type Deal, type DealPipelineStatus, type Rep } from '@/lib/types';
import { useHighlightRow } from '@/lib/use-highlight-row';

function TextCell({
  value,
  onChange,
  required = false,
  width = 'w-32'
}: {
  value: string | null;
  onChange: (value: string) => Promise<void>;
  required?: boolean;
  width?: string;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <input
      type="text"
      defaultValue={value ?? ''}
      disabled={isPending}
      onBlur={(e) => {
        const next = e.target.value;
        if (required && !next.trim()) {
          e.target.value = value ?? '';
          return;
        }
        if (next !== (value ?? '')) startTransition(() => onChange(next));
      }}
      className={`${width} rounded-md border border-neutral-300 px-2 py-1 text-sm text-neutral-900 disabled:opacity-50`}
    />
  );
}

function DateInput({ value, onChange }: { value: string | null; onChange: (value: string) => Promise<void> }) {
  const [isPending, startTransition] = useTransition();
  return (
    <input
      type="date"
      defaultValue={value ?? ''}
      disabled={isPending}
      onChange={(e) => e.target.value && startTransition(() => onChange(e.target.value))}
      className="rounded-md border border-neutral-300 px-2 py-1 text-sm text-neutral-900 disabled:opacity-50"
    />
  );
}

function ValueInput({ value, onChange }: { value: number; onChange: (value: number) => Promise<void> }) {
  const [isPending, startTransition] = useTransition();
  return (
    <input
      type="number"
      defaultValue={value}
      disabled={isPending}
      onBlur={(e) => {
        const n = Number(e.target.value);
        if (!Number.isNaN(n) && n !== value) startTransition(() => onChange(n));
      }}
      className="w-28 rounded-md border border-neutral-300 px-2 py-1 text-sm text-neutral-900 disabled:opacity-50"
    />
  );
}

function AccountCell({ deal, accounts }: { deal: Deal; accounts: Account[] }) {
  const [isPending, startTransition] = useTransition();
  const linkedAccount = deal.account_id ? accounts.find((a) => a.id === deal.account_id) : null;
  return (
    <div className="flex items-center gap-1.5">
      <AccountSelect
        accounts={accounts}
        value={deal.account_id}
        onChange={(account_id) => updateDeal(deal.id, { account_id })}
      />
      {linkedAccount && (
        <Link
          href={`/accounts/${linkedAccount.id}`}
          className="text-xs text-neutral-400 hover:text-neutral-600"
          title={`Open ${linkedAccount.name}`}
        >
          view →
        </Link>
      )}
      {!deal.account_id && deal.company && (
        <button
          disabled={isPending}
          onClick={() => startTransition(() => createAccountFromDeal(deal.id))}
          className="text-xs text-neutral-400 hover:text-neutral-600 disabled:opacity-50"
          title={`Create an account named "${deal.company}" and link this deal to it`}
        >
          + Account
        </button>
      )}
    </div>
  );
}

function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: (checked: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 rounded border-neutral-300"
      aria-label="Select all visible deals"
    />
  );
}

type SortableKey =
  | 'start_date'
  | 'customer_name'
  | 'company'
  | 'pic'
  | 'product'
  | 'value'
  | 'expected_close_date'
  | 'assigned_rep'
  | 'status';
type SortDirection = 'asc' | 'desc';

function SortHeader({
  label,
  sortKey,
  sort,
  onSort
}: {
  label: string;
  sortKey: SortableKey;
  sort: { key: SortableKey; direction: SortDirection };
  onSort: (key: SortableKey) => void;
}) {
  const active = sort.key === sortKey;
  return (
    <th className="px-4 py-3 font-medium">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 text-neutral-500 hover:text-neutral-800"
      >
        {label}
        <span className="text-[10px] text-neutral-400">{active ? (sort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span>
      </button>
    </th>
  );
}

export function DealsTable({
  deals,
  reps,
  accounts,
  statuses
}: {
  deals: Deal[];
  reps: Rep[];
  accounts: Account[];
  statuses: string[];
}) {
  // Note: rows filtered out by statusFilter/repFilter won't scroll/highlight via the
  // ?id= deep-link — filter state doesn't cross-wire into the highlight param. Low
  // priority (only matters if a linked-to deal happens to be excluded by an active
  // filter), documented here rather than fixed this pass.
  const { rowProps } = useHighlightRow();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [repFilter, setRepFilter] = useState<string>('all');
  const [sort, setSort] = useState<{ key: SortableKey; direction: SortDirection }>({
    key: 'start_date',
    direction: 'asc'
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkRep, setBulkRep] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  const [isBulkPending, startBulkTransition] = useTransition();

  const repNameById = useMemo(() => new Map(reps.map((r) => [r.id, r.name])), [reps]);

  // Deals can disappear from `deals` between renders (e.g. deleted elsewhere) without
  // `selected` being told — derive the live subset on read rather than syncing it back
  // into state, so a stale id just quietly drops out instead of needing an effect.
  const liveSelected = useMemo(() => {
    const liveIds = new Set(deals.map((d) => d.id));
    return new Set([...selected].filter((id) => liveIds.has(id)));
  }, [selected, deals]);

  function toggleSort(key: SortableKey) {
    setSort((prev) => (prev.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }));
  }

  function compareDeals(a: Deal, b: Deal, key: SortableKey): number {
    switch (key) {
      case 'value':
        return a.value - b.value;
      case 'start_date':
      case 'expected_close_date':
        return (a[key] ?? '9999-99-99').localeCompare(b[key] ?? '9999-99-99');
      case 'assigned_rep': {
        const an = a.assigned_rep_id ? repNameById.get(a.assigned_rep_id) ?? '' : '';
        const bn = b.assigned_rep_id ? repNameById.get(b.assigned_rep_id) ?? '' : '';
        return an.localeCompare(bn);
      }
      case 'status':
        return DEAL_PIPELINE_STATUSES.indexOf(a.status) - DEAL_PIPELINE_STATUSES.indexOf(b.status);
      default:
        return (a[key] ?? '').localeCompare(b[key] ?? '');
    }
  }

  const filteredAndSorted = useMemo(() => {
    let rows = deals;
    if (statusFilter !== 'all') rows = rows.filter((d) => d.status === statusFilter);
    if (repFilter !== 'all') {
      rows = repFilter === 'unassigned' ? rows.filter((d) => !d.assigned_rep_id) : rows.filter((d) => d.assigned_rep_id === repFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((d) =>
        [d.customer_name, d.company, d.pic, d.product]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(q))
      );
    }
    return [...rows].sort((a, b) => {
      const cmp = compareDeals(a, b, sort.key);
      return sort.direction === 'asc' ? cmp : -cmp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals, search, statusFilter, repFilter, sort, repNameById]);

  const hasActiveFilter = Boolean(search) || statusFilter !== 'all' || repFilter !== 'all';

  function toggleAllVisible(checked: boolean) {
    const visibleIds = filteredAndSorted.map((d) => d.id);
    setSelected((prev) => {
      const next = new Set(prev);
      visibleIds.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return next;
    });
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function applyBulk() {
    const fields: Partial<{ assigned_rep_id: string | null; status: DealPipelineStatus }> = {};
    if (bulkRep) fields.assigned_rep_id = bulkRep === '__unassign__' ? null : bulkRep;
    if (bulkStatus) fields.status = bulkStatus as DealPipelineStatus;
    if (Object.keys(fields).length === 0) return;

    const ids = Array.from(liveSelected);
    if (!confirm(`Apply changes to ${ids.length} selected deal${ids.length === 1 ? '' : 's'}?`)) return;

    startBulkTransition(async () => {
      await bulkUpdateDeals(ids, fields);
      setSelected(new Set());
      setBulkRep('');
      setBulkStatus('');
    });
  }

  function exportDeals() {
    const rows = filteredAndSorted.map((d) => [
      d.customer_name,
      d.company ?? '',
      d.account_id ? accounts.find((a) => a.id === d.account_id)?.name ?? '' : '',
      d.pic ?? '',
      d.product ?? '',
      String(d.value),
      d.expected_close_date ?? '',
      d.notes ?? '',
      d.assigned_rep_id ? repNameById.get(d.assigned_rep_id) ?? '' : '',
      d.status
    ]);
    const csv = buildCsv(
      ['Customer', 'Company', 'Account', 'PIC', 'Product', 'Value', 'Expected Close', 'Notes', 'Assigned Rep', 'Status'],
      rows
    );
    downloadCsv(`deals-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  if (deals.length === 0) return null;

  const visibleIds = filteredAndSorted.map((d) => d.id);
  const selectedVisibleCount = visibleIds.filter((id) => liveSelected.has(id)).length;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer, company, PIC, product…"
          className="w-full max-w-xs rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900"
        />
        <label className="flex items-center gap-1.5 text-xs text-neutral-500">
          Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-700"
          >
            <option value="all">All</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-neutral-500">
          Rep
          <select
            value={repFilter}
            onChange={(e) => setRepFilter(e.target.value)}
            className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-700"
          >
            <option value="all">All</option>
            <option value="unassigned">Unassigned</option>
            {reps.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={exportDeals}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
        >
          Export CSV
        </button>
        {hasActiveFilter && (
          <span className="text-xs text-neutral-400">
            {filteredAndSorted.length} of {deals.length}
          </span>
        )}
      </div>

      {liveSelected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
          <span className="text-sm font-medium text-blue-900">{liveSelected.size} selected</span>
          <select
            value={bulkRep}
            onChange={(e) => setBulkRep(e.target.value)}
            className="rounded-md border border-blue-300 bg-white px-2 py-1 text-xs"
          >
            <option value="">Rep: no change</option>
            <option value="__unassign__">Unassigned</option>
            {reps.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="rounded-md border border-blue-300 bg-white px-2 py-1 text-xs"
          >
            <option value="">Status: no change</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={isBulkPending || (!bulkRep && !bulkStatus)}
            onClick={applyBulk}
            className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
          >
            Apply
          </button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-xs text-blue-700 hover:underline">
            Clear selection
          </button>
        </div>
      )}

      {filteredAndSorted.length === 0 ? (
        <p className="text-sm text-neutral-500">No deals match this search.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">
                  <SelectAllCheckbox
                    checked={visibleIds.length > 0 && selectedVisibleCount === visibleIds.length}
                    indeterminate={selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length}
                    onChange={toggleAllVisible}
                  />
                </th>
                <SortHeader label="Customer" sortKey="customer_name" sort={sort} onSort={toggleSort} />
                <SortHeader label="Company" sortKey="company" sort={sort} onSort={toggleSort} />
                <th className="px-4 py-3 font-medium">Account</th>
                <SortHeader label="PIC" sortKey="pic" sort={sort} onSort={toggleSort} />
                <SortHeader label="Product / Order" sortKey="product" sort={sort} onSort={toggleSort} />
                <SortHeader label="Value" sortKey="value" sort={sort} onSort={toggleSort} />
                <SortHeader label="Expected Close" sortKey="expected_close_date" sort={sort} onSort={toggleSort} />
                <th className="px-4 py-3 font-medium">Notes</th>
                <SortHeader label="Assigned Rep" sortKey="assigned_rep" sort={sort} onSort={toggleSort} />
                <SortHeader label="Status" sortKey="status" sort={sort} onSort={toggleSort} />
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredAndSorted.map((deal) => (
                <tr key={deal.id} {...rowProps(deal.id)}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={liveSelected.has(deal.id)}
                      onChange={(e) => toggleOne(deal.id, e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300"
                      aria-label={`Select deal for ${deal.customer_name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <TextCell
                      value={deal.customer_name}
                      onChange={(customer_name) => updateDeal(deal.id, { customer_name })}
                      required
                    />
                  </td>
                  <td className="px-4 py-3">
                    <TextCell value={deal.company} onChange={(company) => updateDeal(deal.id, { company })} />
                  </td>
                  <td className="px-4 py-3">
                    <AccountCell deal={deal} accounts={accounts} />
                  </td>
                  <td className="px-4 py-3">
                    <TextCell value={deal.pic} onChange={(pic) => updateDeal(deal.id, { pic })} />
                  </td>
                  <td className="px-4 py-3">
                    <TextCell value={deal.product} onChange={(product) => updateDeal(deal.id, { product })} width="w-40" />
                  </td>
                  <td className="px-4 py-3">
                    <ValueInput value={deal.value} onChange={(value) => updateDeal(deal.id, { value })} />
                  </td>
                  <td className="px-4 py-3">
                    <DateInput
                      value={deal.expected_close_date}
                      onChange={(expected_close_date) => updateDeal(deal.id, { expected_close_date })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <NotesButton
                      title={deal.customer_name}
                      subtitle={deal.company}
                      notes={deal.notes}
                      onSave={(notes) => updateDeal(deal.id, { notes })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <RepSelect
                      reps={reps}
                      value={deal.assigned_rep_id}
                      onChange={(repId) => updateDeal(deal.id, { assigned_rep_id: repId })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <StatusSelect
                      options={statuses}
                      value={deal.status}
                      onChange={(status) => updateDeal(deal.id, { status: status as Deal['status'] })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <DeleteButton
                      onDelete={() => deleteDeal(deal.id)}
                      confirmMessage={`Delete the deal with ${deal.customer_name}? This can't be undone.`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
