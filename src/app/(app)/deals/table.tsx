'use client';

import { useTransition } from 'react';
import { deleteDeal, updateDeal } from '@/app/actions';
import { DeleteButton } from '@/components/delete-button';
import { RepSelect } from '@/components/rep-select';
import { StatusSelect } from '@/components/status-select';
import type { Deal, Rep } from '@/lib/types';

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

export function DealsTable({
  deals,
  reps,
  statuses
}: {
  deals: Deal[];
  reps: Rep[];
  statuses: string[];
}) {
  if (deals.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
          <tr>
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">PIC</th>
            <th className="px-4 py-3 font-medium">Product / Order</th>
            <th className="px-4 py-3 font-medium">Value</th>
            <th className="px-4 py-3 font-medium">Expected Close</th>
            <th className="px-4 py-3 font-medium">Assigned Rep</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {deals.map((deal) => (
            <tr key={deal.id}>
              <td className="px-4 py-3 text-neutral-900">{deal.customer_name}</td>
              <td className="px-4 py-3 text-neutral-600">{deal.company || '—'}</td>
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
  );
}
