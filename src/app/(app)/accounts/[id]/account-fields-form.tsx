'use client';

import { useTransition } from 'react';
import { updateAccount } from '@/app/actions';
import { RepSelect } from '@/components/rep-select';
import type { Account, Rep } from '@/lib/types';

function TextField({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string | null;
  onChange: (value: string) => Promise<void>;
  placeholder?: string;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-neutral-500">{label}</label>
      <input
        type="text"
        defaultValue={value ?? ''}
        placeholder={placeholder}
        disabled={isPending}
        onBlur={(e) => {
          if (e.target.value !== (value ?? '')) startTransition(() => onChange(e.target.value));
        }}
        className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900 disabled:opacity-50"
      />
    </div>
  );
}

export function AccountFieldsForm({ account, reps }: { account: Account; reps: Rep[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      <TextField label="Name" value={account.name} onChange={(name) => updateAccount(account.id, { name })} />
      <TextField label="HQ" value={account.hq} onChange={(hq) => updateAccount(account.id, { hq })} />
      <TextField label="Website" value={account.website} onChange={(website) => updateAccount(account.id, { website })} />
      <TextField
        label="Industry"
        value={account.industry}
        onChange={(industry) => updateAccount(account.id, { industry })}
      />
      <TextField
        label="Company size"
        value={account.company_size}
        onChange={(company_size) => updateAccount(account.id, { company_size })}
      />
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Assigned rep</label>
        <RepSelect
          reps={reps}
          value={account.assigned_rep_id}
          onChange={(repId) => updateAccount(account.id, { assigned_rep_id: repId })}
        />
      </div>
      <div className="sm:col-span-2 lg:col-span-4">
        <TextField label="Notes" value={account.notes} onChange={(notes) => updateAccount(account.id, { notes })} />
      </div>
    </div>
  );
}
