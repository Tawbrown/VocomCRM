'use client';

import { useTransition } from 'react';

const STATUS_COLORS: Record<string, string> = {
  New: 'bg-neutral-100 text-neutral-700',
  Contacted: 'bg-blue-100 text-blue-700',
  Qualified: 'bg-amber-100 text-amber-700',
  Prospecting: 'bg-neutral-100 text-neutral-700',
  Connected: 'bg-blue-100 text-blue-700',
  Conversation: 'bg-amber-100 text-amber-700',
  Meeting: 'bg-purple-100 text-purple-700',
  Won: 'bg-green-100 text-green-700',
  Lost: 'bg-red-100 text-red-700',
  Proposal: 'bg-blue-100 text-blue-700',
  Negotiation: 'bg-amber-100 text-amber-700',
  Open: 'bg-neutral-100 text-neutral-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Resolved: 'bg-green-100 text-green-700',
  "Won't Fix": 'bg-red-100 text-red-700'
};

export function StatusSelect({
  options,
  value,
  onChange
}: {
  options: string[];
  value: string;
  onChange: (value: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={value}
      disabled={isPending}
      onChange={(e) => startTransition(() => onChange(e.target.value))}
      className={`rounded-md border-0 px-2 py-1 text-sm font-medium disabled:opacity-50 ${
        STATUS_COLORS[value] ?? 'bg-neutral-100 text-neutral-700'
      }`}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
