'use client';

import { useTransition } from 'react';
import type { Deal } from '@/lib/types';

export function DealSelect({
  deals,
  value,
  onChange
}: {
  deals: Deal[];
  value: string | null;
  onChange: (dealId: string | null) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={value ?? ''}
      disabled={isPending}
      onChange={(e) => startTransition(() => onChange(e.target.value || null))}
      className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm disabled:opacity-50"
    >
      <option value="">No deal</option>
      {deals.map((deal) => (
        <option key={deal.id} value={deal.id}>
          {deal.customer_name}
        </option>
      ))}
    </select>
  );
}
