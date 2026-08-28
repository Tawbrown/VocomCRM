'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { deleteAccount, updateAccount } from '@/app/actions';
import { DeleteButton } from '@/components/delete-button';
import { RepSelect } from '@/components/rep-select';
import type { Account, Rep } from '@/lib/types';
import { useHighlightRow } from '@/lib/use-highlight-row';

function Cell({ value, onChange, width = 'w-32' }: { value: string | null; onChange: (value: string) => Promise<void>; width?: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <input
      type="text"
      defaultValue={value ?? ''}
      disabled={isPending}
      onBlur={(e) => {
        if (e.target.value !== (value ?? '')) startTransition(() => onChange(e.target.value));
      }}
      className={`${width} rounded-md border border-neutral-300 px-2 py-1 text-sm text-neutral-900 disabled:opacity-50`}
    />
  );
}

type SortKey = 'name' | 'created_at' | 'deals_desc';

export function AccountsTable({
  accounts,
  reps,
  contactCounts,
  dealCounts
}: {
  accounts: Account[];
  reps: Rep[];
  contactCounts: Record<string, number>;
  dealCounts: Record<string, number>;
}) {
  const { rowProps } = useHighlightRow();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = accounts;
    if (q) {
      rows = rows.filter((a) =>
        [a.name, a.hq, a.website, a.industry].filter(Boolean).some((field) => field!.toLowerCase().includes(q))
      );
    }
    const sorted = [...rows];
    switch (sortKey) {
      case 'created_at':
        sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
        break;
      case 'deals_desc':
        sorted.sort((a, b) => (dealCounts[b.id] ?? 0) - (dealCounts[a.id] ?? 0));
        break;
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [accounts, search, sortKey, dealCounts]);

  if (accounts.length === 0) {
    return <p className="text-sm text-neutral-500">No accounts yet.</p>;
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, HQ, website, industry…"
          className="w-full max-w-xs rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900"
        />
        <label className="flex items-center gap-1.5 text-xs text-neutral-500">
          Sort by
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-700"
          >
            <option value="name">Name (A-Z)</option>
            <option value="created_at">Most Recent</option>
            <option value="deals_desc">Deals (Most)</option>
          </select>
        </label>
        {search && (
          <span className="text-xs text-neutral-400">
            {filteredAndSorted.length} of {accounts.length}
          </span>
        )}
      </div>

      {filteredAndSorted.length === 0 ? (
        <p className="text-sm text-neutral-500">No accounts match this search.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">HQ</th>
                <th className="px-4 py-3 font-medium">Website</th>
                <th className="px-4 py-3 font-medium">Industry</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Assigned Rep</th>
                <th className="px-4 py-3 font-medium">POCs</th>
                <th className="px-4 py-3 font-medium">Deals</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredAndSorted.map((account) => (
                <tr key={account.id} {...rowProps(account.id)}>
                  <td className="px-4 py-3 text-neutral-900">
                    <Link href={`/accounts/${account.id}`} className="font-medium hover:underline">
                      {account.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Cell value={account.hq} onChange={(hq) => updateAccount(account.id, { hq })} />
                  </td>
                  <td className="px-4 py-3">
                    <Cell value={account.website} onChange={(website) => updateAccount(account.id, { website })} />
                  </td>
                  <td className="px-4 py-3">
                    <Cell value={account.industry} onChange={(industry) => updateAccount(account.id, { industry })} />
                  </td>
                  <td className="px-4 py-3">
                    <Cell
                      value={account.company_size}
                      onChange={(company_size) => updateAccount(account.id, { company_size })}
                      width="w-20"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <RepSelect
                      reps={reps}
                      value={account.assigned_rep_id}
                      onChange={(repId) => updateAccount(account.id, { assigned_rep_id: repId })}
                    />
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{contactCounts[account.id] ?? 0}</td>
                  <td className="px-4 py-3 text-neutral-600">{dealCounts[account.id] ?? 0}</td>
                  <td className="px-4 py-3">
                    <DeleteButton
                      onDelete={() => deleteAccount(account.id)}
                      confirmMessage={`Delete "${account.name}"? Its contacts will be deleted too. Linked deals/leads stay, just unlinked from this account. This can't be undone.`}
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
