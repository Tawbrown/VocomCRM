'use client';

import { useState } from 'react';
import { updateInstantlyLead } from '@/app/actions';
import { RepSelect } from '@/components/rep-select';
import { StatusSelect } from '@/components/status-select';
import type { InstantlyLead, Rep } from '@/lib/types';

const INTEREST_COLORS: Record<string, string> = {
  Interested: 'bg-green-100 text-green-700',
  'Meeting Booked': 'bg-purple-100 text-purple-700',
  'Meeting Completed': 'bg-purple-100 text-purple-700',
  Won: 'bg-green-100 text-green-700',
  'Out of Office': 'bg-amber-100 text-amber-700',
  'Not Interested': 'bg-red-100 text-red-700',
  'Wrong Person': 'bg-red-100 text-red-700',
  Lost: 'bg-red-100 text-red-700',
  'No Show': 'bg-red-100 text-red-700',
  Uncontacted: 'bg-neutral-100 text-neutral-500'
};

const FILTERS = ['All', 'Interested', 'Out of Office', 'Meeting Booked', 'Uncontacted'];

export function InstantlyLeadsTable({
  leads,
  reps,
  statuses
}: {
  leads: InstantlyLead[];
  reps: Rep[];
  statuses: string[];
}) {
  const [filter, setFilter] = useState('All');
  const [coldCallOnly, setColdCallOnly] = useState(false);

  const coldCallCount = leads.filter((lead) => lead.needs_cold_call).length;

  const filtered = leads
    .filter((lead) => filter === 'All' || lead.interest_status === filter)
    .filter((lead) => !coldCallOnly || lead.needs_cold_call);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === f
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-600 ring-1 ring-inset ring-neutral-200 hover:bg-neutral-100'
            }`}
          >
            {f}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-neutral-200" />
        <button
          onClick={() => setColdCallOnly((v) => !v)}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            coldCallOnly
              ? 'bg-red-600 text-white'
              : 'bg-white text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-50'
          }`}
        >
          📞 Needs Cold Call ({coldCallCount})
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-neutral-500">No leads match this filter.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Reply</th>
                <th className="px-4 py-3 font-medium">Campaign</th>
                <th className="px-4 py-3 font-medium">Interest</th>
                <th className="px-4 py-3 font-medium">Assigned Rep</th>
                <th className="px-4 py-3 font-medium">Sales Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((lead) => (
                <tr key={lead.id} className={lead.needs_cold_call ? 'bg-red-50/50' : undefined}>
                  <td className="px-4 py-3 text-neutral-900">
                    {lead.linkedin_url ? (
                      <a
                        href={lead.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {lead.name || lead.email}
                      </a>
                    ) : (
                      lead.name || lead.email
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{lead.company || '—'}</td>
                  <td className="px-4 py-3 text-neutral-600">{lead.email}</td>
                  <td className="px-4 py-3">
                    {lead.reply_phone ? (
                      <span
                        className="rounded-md bg-red-100 px-2 py-1 font-medium text-red-700"
                        title="Extracted from their reply — double check against the full text before calling"
                      >
                        📞 {lead.reply_phone}
                      </span>
                    ) : (
                      <span className="text-neutral-600">{lead.phone || '—'}</span>
                    )}
                  </td>
                  <td className="max-w-[220px] px-4 py-3 text-neutral-600">
                    {lead.reply_text ? (
                      <span
                        className="block max-w-[220px] truncate"
                        title={lead.reply_text}
                      >
                        {lead.reply_text}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="max-w-[160px] truncate px-4 py-3 text-neutral-500" title={lead.campaign ?? ''}>
                    {lead.campaign || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-medium ${
                        INTEREST_COLORS[lead.interest_status] ?? 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {lead.interest_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <RepSelect
                      reps={reps}
                      value={lead.assigned_rep_id}
                      onChange={(repId) => updateInstantlyLead(lead.id, { assigned_rep_id: repId })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <StatusSelect
                      options={statuses}
                      value={lead.sales_status}
                      onChange={(status) =>
                        updateInstantlyLead(lead.id, {
                          sales_status: status as InstantlyLead['sales_status']
                        })
                      }
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
