'use client';

import { useTransition } from 'react';
import type { Account } from '@/lib/types';

export function AccountSelect({
  accounts,
  value,
  onChange
}: {
  accounts: Account[];
  value: string | null;
  onChange: (accountId: string | null) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={value ?? ''}
      disabled={isPending}
      onChange={(e) => startTransition(() => onChange(e.target.value || null))}
      className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm disabled:opacity-50"
    >
      <option value="">No account</option>
      {accounts.map((account) => (
        <option key={account.id} value={account.id}>
          {account.name}
        </option>
      ))}
    </select>
  );
}
