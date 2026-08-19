'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { deleteInstantlyLead, updateInstantlyLead } from '@/app/actions';
import { DeleteButton } from '@/components/delete-button';
import { RepSelect } from '@/components/rep-select';
import { StatusSelect } from '@/components/status-select';
import type { InstantlyLead, Rep } from '@/lib/types';
import { CAMPAIGN_STATUS_FILTERS, INTEREST_FILTERS, SEQUENCE_STATUS_FILTERS } from './constants';

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
  'No Reply Yet': 'bg-neutral-100 text-neutral-500'
};

const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-100 text-green-700',
  Paused: 'bg-amber-100 text-amber-700',
  Completed: 'bg-neutral-100 text-neutral-500',
  'Running Subsequences': 'bg-blue-100 text-blue-700',
  Draft: 'bg-neutral-100 text-neutral-400',
  'Accounts Unhealthy': 'bg-red-100 text-red-700',
  'Bounce Protect': 'bg-red-100 text-red-700',
  'Account Suspended': 'bg-red-100 text-red-700'
};

// Combines sequence_status with whether the lead has been emailed yet into one label —
// "yet to start / in the middle / completed the flow" is what reps actually want to see
// per lead, not the raw Instantly enum.
function sequenceStage(lead: InstantlyLead): { label: string; colorClass: string } {
  switch (lead.sequence_status) {
    case 'Bounced':
      return { label: 'Bounced', colorClass: 'bg-red-100 text-red-700' };
    case 'Unsubscribed':
      return { label: 'Unsubscribed', colorClass: 'bg-red-100 text-red-700' };
    case 'Skipped':
      return { label: 'Skipped', colorClass: 'bg-neutral-100 text-neutral-400' };
    case 'Paused':
      return { label: 'Paused', colorClass: 'bg-amber-100 text-amber-700' };
    case 'Completed':
      return { label: 'Sequence complete', colorClass: 'bg-neutral-100 text-neutral-500' };
    default:
      if (!lead.last_contacted_at) return { label: 'Not started', colorClass: 'bg-neutral-100 text-neutral-400' };
      return { label: 'In progress', colorClass: 'bg-blue-100 text-blue-700' };
  }
}

function ReplyModal({ lead, onClose }: { lead: InstantlyLead; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-neutral-900">{lead.name || lead.email}</h3>
            <p className="text-xs text-neutral-500">
              {lead.company} · {lead.campaign}
              {lead.last_reply_at ? ` · ${new Date(lead.last_reply_at).toLocaleString()}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            ✕
          </button>
        </div>
        {lead.reply_phone && (
          <p className="mb-3 rounded-md bg-red-100 px-2 py-1 text-sm font-medium text-red-700">
            📞 {lead.reply_phone} — extracted from the reply below, double check it&apos;s correct
          </p>
        )}
        {lead.alternative_email && (
          <p className="mb-3 rounded-md bg-amber-100 px-2 py-1 text-sm font-medium text-amber-700">
            ✉️ {lead.alternative_email} — other contact email(s) mentioned in the reply
          </p>
        )}
        <p className="whitespace-pre-wrap text-sm text-neutral-700">{lead.reply_text}</p>
      </div>
    </div>
  );
}

interface Summary {
  total: number;
  activeCampaigns: number;
  completedCampaigns: number;
  notStarted: number;
  awaitingReply: number;
  replied: number;
  sequenceCompleteNoReply: number;
}

export function InstantlyLeadsTable({
  leads,
  reps,
  statuses,
  filter,
  campaignStatus,
  sequenceStatus,
  coldCallOnly,
  notStartedOnly,
  sort,
  highlightId,
  page,
  pageSize,
  totalCount,
  coldCallCount,
  filterCounts,
  summary
}: {
  leads: InstantlyLead[];
  reps: Rep[];
  statuses: string[];
  filter: string;
  campaignStatus: string;
  sequenceStatus: string;
  coldCallOnly: boolean;
  notStartedOnly: boolean;
  sort: string;
  highlightId: string | null;
  page: number;
  pageSize: number;
  totalCount: number;
  coldCallCount: number;
  filterCounts: Record<string, number>;
  summary: Summary;
}) {
  const [openReply, setOpenReply] = useState<InstantlyLead | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const hasActiveFilters =
    filter !== 'All' || campaignStatus !== 'All' || sequenceStatus !== 'All' || coldCallOnly || notStartedOnly;

  const baseParams = new URLSearchParams();
  if (filter !== 'All') baseParams.set('filter', filter);
  if (campaignStatus !== 'All') baseParams.set('campaignStatus', campaignStatus);
  if (sequenceStatus !== 'All') baseParams.set('sequenceStatus', sequenceStatus);
  if (coldCallOnly) baseParams.set('coldCall', '1');
  if (notStartedOnly) baseParams.set('notStarted', '1');
  if (sort !== 'synced') baseParams.set('sort', sort);

  const interestHref = (f: string) => {
    const params = new URLSearchParams(baseParams);
    if (f === 'All') params.delete('filter');
    else params.set('filter', f);
    return `?${params.toString()}`;
  };
  const coldCallHref = (() => {
    const params = new URLSearchParams(baseParams);
    if (coldCallOnly) params.delete('coldCall');
    else params.set('coldCall', '1');
    return `?${params.toString()}`;
  })();
  const notStartedHref = (() => {
    const params = new URLSearchParams(baseParams);
    if (notStartedOnly) params.delete('notStarted');
    else params.set('notStarted', '1');
    return `?${params.toString()}`;
  })();

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pageHref = (p: number) => {
    const params = new URLSearchParams(baseParams);
    params.set('page', String(p));
    return `?${params.toString()}`;
  };

  function navigateWith(key: string, value: string) {
    const params = new URLSearchParams(baseParams);
    if (value === 'All') params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  const tiles: { label: string; count: number; hint?: string }[] = [
    { label: 'Total Leads', count: summary.total },
    { label: 'In Active Campaigns', count: summary.activeCampaigns },
    { label: 'In Completed Campaigns', count: summary.completedCampaigns },
    { label: 'Not Started Yet', count: summary.notStarted },
    { label: 'Awaiting Reply', count: summary.awaitingReply },
    {
      label: 'Sequence Done, No Reply',
      count: summary.sequenceCompleteNoReply,
      hint: "A lead's own sequence can finish while their campaign is still Active (other leads in it are still mid-sequence) — so this is often bigger than \"In Completed Campaigns\", which only counts campaigns that are entirely done."
    },
    { label: 'Replied', count: summary.replied }
  ];

  return (
    <div>
      {highlightId && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-vocom/30 bg-vocom/5 px-4 py-2 text-sm text-neutral-700">
          <span>Showing 1 lead from a notification.</span>
          <Link href={pathname} className="font-medium text-vocom hover:underline">
            View all leads
          </Link>
        </div>
      )}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
            <p className="text-xs text-neutral-500">
              {tile.label}
              {tile.hint && (
                <span className="ml-1 cursor-help text-neutral-400" title={tile.hint}>
                  ⓘ
                </span>
              )}
            </p>
            <p className="mt-1 text-xl font-semibold text-neutral-900">{tile.count}</p>
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-neutral-500">
          Campaign
          <select
            value={campaignStatus}
            onChange={(e) => navigateWith('campaignStatus', e.target.value)}
            className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-700"
          >
            {CAMPAIGN_STATUS_FILTERS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-neutral-500">
          Sequence
          <select
            value={sequenceStatus}
            onChange={(e) => navigateWith('sequenceStatus', e.target.value)}
            className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-700"
          >
            {SEQUENCE_STATUS_FILTERS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <Link
          href={notStartedHref}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            notStartedOnly
              ? 'bg-neutral-900 text-white'
              : 'bg-white text-neutral-600 ring-1 ring-inset ring-neutral-200 hover:bg-neutral-100'
          }`}
        >
          Not Started Yet ({summary.notStarted})
        </Link>
        <span className="mx-1 h-4 w-px bg-neutral-200" />
        <label className="flex items-center gap-1.5 text-xs text-neutral-500">
          Sort by
          <select
            value={sort}
            onChange={(e) => navigateWith('sort', e.target.value === 'active' ? 'active' : 'synced')}
            className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-700"
          >
            <option value="synced">Recently Synced</option>
            <option value="active">Most Recently Active</option>
          </select>
        </label>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {INTEREST_FILTERS.map((f) => (
          <Link
            key={f}
            href={interestHref(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === f
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-600 ring-1 ring-inset ring-neutral-200 hover:bg-neutral-100'
            }`}
          >
            {f} ({filterCounts[f] ?? 0})
          </Link>
        ))}
        <span className="mx-1 h-4 w-px bg-neutral-200" />
        <Link
          href={coldCallHref}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            coldCallOnly
              ? 'bg-red-600 text-white'
              : 'bg-white text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-50'
          }`}
        >
          📞 Needs Cold Call ({coldCallCount})
        </Link>
      </div>
      <p className="mb-4 text-xs text-neutral-400">
        &quot;No Reply Yet&quot; is Instantly&apos;s own interest classification and includes
        both leads still waiting on a reply <em>and</em> leads not yet contacted — use{' '}
        <strong>Not Started Yet</strong> / <strong>Awaiting Reply</strong> above to tell them
        apart.
      </p>

      {hasActiveFilters && (
        <p className="mb-3 text-sm text-neutral-600">
          <span className="font-semibold text-neutral-900">{totalCount.toLocaleString()}</span> of{' '}
          {summary.total.toLocaleString()} leads match these filters
        </p>
      )}

      {leads.length === 0 ? (
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
                <th className="px-4 py-3 font-medium">Sequence</th>
                <th className="px-4 py-3 font-medium">Last Activity</th>
                <th className="px-4 py-3 font-medium">Interest</th>
                <th className="px-4 py-3 font-medium">Assigned Rep</th>
                <th className="px-4 py-3 font-medium">Sales Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {leads.map((lead) => (
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
                  <td className="px-4 py-3 text-neutral-600">
                    {lead.email}
                    {lead.alternative_email && (
                      <button
                        onClick={() => setOpenReply(lead)}
                        className="mt-0.5 block text-xs font-medium text-amber-700 hover:underline"
                        title="Other email(s) mentioned in their reply"
                      >
                        ✉️ {lead.alternative_email}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {lead.reply_phone ? (
                      <button
                        onClick={() => setOpenReply(lead)}
                        className="rounded-md bg-red-100 px-2 py-1 font-medium text-red-700 hover:bg-red-200"
                      >
                        📞 {lead.reply_phone}
                      </button>
                    ) : (
                      <span className="text-neutral-600">{lead.phone || '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {lead.reply_text ? (
                      <button
                        onClick={() => setOpenReply(lead)}
                        className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200"
                      >
                        View reply
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="max-w-[160px] px-4 py-3 text-neutral-500">
                    <p className="truncate" title={lead.campaign ?? ''}>
                      {lead.campaign || '—'}
                    </p>
                    {lead.campaign_status && (
                      <span
                        className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                          CAMPAIGN_STATUS_COLORS[lead.campaign_status] ?? 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        {lead.campaign_status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const stage = sequenceStage(lead);
                      return (
                        <span className={`rounded-md px-2 py-1 text-xs font-medium ${stage.colorClass}`}>
                          {stage.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                    {lead.last_reply_at ? new Date(lead.last_reply_at).toLocaleDateString() : '—'}
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
                  <td className="px-4 py-3">
                    <DeleteButton onDelete={() => deleteInstantlyLead(lead.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 text-sm text-neutral-500">
            <span>
              {totalCount === 0
                ? '0 results'
                : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalCount)} of ${totalCount}`}
            </span>
            <div className="flex gap-2">
              <Link
                href={pageHref(Math.max(1, page - 1))}
                aria-disabled={page <= 1}
                className={`rounded-md px-3 py-1 ring-1 ring-inset ring-neutral-200 ${
                  page <= 1 ? 'pointer-events-none text-neutral-300' : 'hover:bg-neutral-100'
                }`}
              >
                Previous
              </Link>
              <Link
                href={pageHref(Math.min(totalPages, page + 1))}
                aria-disabled={page >= totalPages}
                className={`rounded-md px-3 py-1 ring-1 ring-inset ring-neutral-200 ${
                  page >= totalPages ? 'pointer-events-none text-neutral-300' : 'hover:bg-neutral-100'
                }`}
              >
                Next
              </Link>
            </div>
          </div>
        </div>
      )}

      {openReply && <ReplyModal lead={openReply} onClose={() => setOpenReply(null)} />}
    </div>
  );
}
