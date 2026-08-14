'use client';

import { useTransition } from 'react';
import type { Rep } from '@/lib/types';

export function RepSelect({
  reps,
  value,
  onChange
}: {
  reps: Rep[];
  value: string | null;
  onChange: (repId: string | null) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={value ?? ''}
      disabled={isPending}
      onChange={(e) => startTransition(() => onChange(e.target.value || null))}
      className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm disabled:opacity-50"
    >
      <option value="">Unassigned</option>
      {reps.map((rep) => (
        <option key={rep.id} value={rep.id}>
          {rep.name}
        </option>
      ))}
    </select>
  );
}
