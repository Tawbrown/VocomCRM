'use client';

import { useMemo, useState } from 'react';
import { useTransition } from 'react';
import { createAccountFromDeal, deleteDeal, updateDeal } from '@/app/actions';
import { AccountSelect } from '@/components/account-select';
import { DeleteButton } from '@/components/delete-button';
import { RepSelect } from '@/components/rep-select';
import { StatusSelect } from '@/components/status-select';
import type { Account, Deal, Rep } from '@/lib/types';
import { useHighlightRow } from '@/lib/use-highlight-row';

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

function NotesInput({ value, onChange }: { value: string | null; onChange: (value: string) => Promise<void> }) {
  const [isPending, startTransition] = useTransition();
  return (
    <input
      type="text"
      defaultValue={value ?? ''}
      placeholder="Add a note…"
      disabled={isPending}
      onBlur={(e) => {
        if (e.target.value !== (value ?? '')) startTransition(() => onChange(e.target.value));
      }}
      className="w-40 rounded-md border border-neutral-300 px-2 py-1 text-sm text-neutral-900 disabled:opacity-50"
    />
  );
}

function AccountCell({ deal, accounts }: { deal: Deal; accounts: Account[] }) {
  const [isPending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-1.5">
      <AccountSelect
        accounts={accounts}
        value={deal.account_id}
        onChange={(account_id) => updateDeal(deal.id, { account_id })}
      />
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

type SortKey = 'start_date' | 'value_desc' | 'expected_close_date' | 'customer_name';

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
  const { rowProps } = useHighlightRow();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('start_date');

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = deals;
    if (q) {
      rows = rows.filter((d) =>
        [d.customer_name, d.company, d.pic, d.product]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(q))
      );
    }
    const sorted = [...rows];
    switch (sortKey) {
      case 'value_desc':
        sorted.sort((a, b) => b.value - a.value);
        break;
      case 'expected_close_date':
        sorted.sort((a, b) => (a.expected_close_date ?? '9999').localeCompare(b.expected_close_date ?? '9999'));
        break;
      case 'customer_name':
        sorted.sort((a, b) => a.customer_name.localeCompare(b.customer_name));
        break;
      default:
        sorted.sort((a, b) => a.start_date.localeCompare(b.start_date));
    }
    return sorted;
  }, [deals, search, sortKey]);

  if (deals.length === 0) return null;

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
          Sort by
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-700"
          >
            <option value="start_date">Start Date</option>
            <option value="expected_close_date">Expected Close</option>
            <option value="value_desc">Value (High to Low)</option>
            <option value="customer_name">Customer Name (A-Z)</option>
          </select>
        </label>
        {search && (
          <span className="text-xs text-neutral-400">
            {filteredAndSorted.length} of {deals.length}
          </span>
        )}
      </div>

      {filteredAndSorted.length === 0 ? (
        <p className="text-sm text-neutral-500">No deals match this search.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">PIC</th>
                <th className="px-4 py-3 font-medium">Product / Order</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Expected Close</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 font-medium">Assigned Rep</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredAndSorted.map((deal) => (
                <tr key={deal.id} {...rowProps(deal.id)}>
                  <td className="px-4 py-3 text-neutral-900">{deal.customer_name}</td>
                  <td className="px-4 py-3 text-neutral-600">{deal.company || '—'}</td>
                  <td className="px-4 py-3">
                    <AccountCell deal={deal} accounts={accounts} />
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{deal.pic || '—'}</td>
                  <td className="px-4 py-3 text-neutral-600">{deal.product || '—'}</td>
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
                    <NotesInput value={deal.notes} onChange={(notes) => updateDeal(deal.id, { notes })} />
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
