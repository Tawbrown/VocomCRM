'use client';

import { useTransition } from 'react';

export const STATUS_COLORS: Record<string, string> = {
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
  "Won't Fix": 'bg-red-100 text-red-700',
  Website: 'bg-blue-100 text-blue-700',
  'Offline Event': 'bg-purple-100 text-purple-700',
  Referral: 'bg-green-100 text-green-700',
  Research: 'bg-amber-100 text-amber-700',
  LinkedIn: 'bg-sky-100 text-sky-700',
  Other: 'bg-neutral-100 text-neutral-500',
  Low: 'bg-neutral-100 text-neutral-500',
  Medium: 'bg-amber-100 text-amber-700',
  High: 'bg-red-100 text-red-700',
  // Region (accounts.region)
  'US-East': 'bg-blue-100 text-blue-700',
  'US-Central': 'bg-sky-100 text-sky-700',
  'US-West': 'bg-cyan-100 text-cyan-700',
  Canada: 'bg-red-100 text-red-700',
  APAC: 'bg-teal-100 text-teal-700',
  EMEA: 'bg-amber-100 text-amber-700',
  // 'Other' already defined above (from LeadSource) — Region's 'Other' reuses it
  // Division (deals.division)
  'Vocom International': 'bg-blue-100 text-blue-700',
  'Vocom AI': 'bg-purple-100 text-purple-700'
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
