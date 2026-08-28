'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { deleteLead, updateLead } from '@/app/actions';
import { DealSelect } from '@/components/deal-select';
import { DeleteButton } from '@/components/delete-button';
import { NotesButton } from '@/components/notes-button';
import { RepSelect } from '@/components/rep-select';
import { StatusSelect } from '@/components/status-select';
import { LEAD_PRIORITIES, LEAD_SOURCES, type Deal, type Lead, type Rep } from '@/lib/types';
import { useHighlightRow } from '@/lib/use-highlight-row';

function Cell({
  value,
  onChange,
  width = 'w-28'
}: {
  value: string | null;
  onChange: (value: string) => Promise<void>;
  width?: string;
}) {
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

function NameCell({ lead }: { lead: Lead }) {
  return (
    <div className="flex items-center gap-1.5">
      <Cell value={lead.name} onChange={(name) => updateLead(lead.id, { name })} />
      {lead.linkedin_url && (
        <a
          href={lead.linkedin_url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-neutral-400 hover:text-neutral-600"
          title="Open LinkedIn profile"
        >
          🔗
        </a>
      )}
    </div>
  );
}

function DealCell({ lead, deals }: { lead: Lead; deals: Deal[] }) {
  const linkedDeal = lead.deal_id ? deals.find((d) => d.id === lead.deal_id) : null;
  return (
    <div className="flex items-center gap-1.5">
      <DealSelect deals={deals} value={lead.deal_id} onChange={(deal_id) => updateLead(lead.id, { deal_id })} />
      {linkedDeal && (
        <Link
          href={`/deals?id=${linkedDeal.id}`}
          className="text-xs text-neutral-400 hover:text-neutral-600"
          title={`Open ${linkedDeal.customer_name} on Deals`}
        >
          view →
        </Link>
      )}
    </div>
  );
}

export function LeadsTable({
  leads,
  reps,
  deals,
  statuses
}: {
  leads: Lead[];
  reps: Rep[];
  deals: Deal[];
  statuses: string[];
}) {
  const { rowProps } = useHighlightRow();

  if (leads.length === 0) {
    return <p className="text-sm text-neutral-500">No leads yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Job Title</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Phone</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Deal</th>
            <th className="px-4 py-3 font-medium">Notes</th>
            <th className="px-4 py-3 font-medium">Source</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Company Size</th>
            <th className="px-4 py-3 font-medium">Use Case</th>
            <th className="px-4 py-3 font-medium">Assigned Rep</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {leads.map((lead) => (
            <tr key={lead.id} {...rowProps(lead.id)}>
              <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                {new Date(lead.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <NameCell lead={lead} />
              </td>
              <td className="px-4 py-3">
                <Cell value={lead.job_title} onChange={(job_title) => updateLead(lead.id, { job_title })} />
              </td>
              <td className="px-4 py-3">
                <Cell value={lead.email} onChange={(email) => updateLead(lead.id, { email })} width="w-40" />
              </td>
              <td className="px-4 py-3">
                <Cell value={lead.phone} onChange={(phone) => updateLead(lead.id, { phone })} />
              </td>
              <td className="px-4 py-3">
                <Cell value={lead.company} onChange={(company) => updateLead(lead.id, { company })} />
              </td>
              <td className="px-4 py-3">
                <DealCell lead={lead} deals={deals} />
              </td>
              <td className="px-4 py-3">
                <NotesButton
                  title={lead.name || lead.company || 'Lead'}
                  subtitle={lead.company}
                  notes={lead.notes}
                  onSave={(notes) => updateLead(lead.id, { notes })}
                />
              </td>
              <td className="px-4 py-3">
                <StatusSelect
                  options={LEAD_SOURCES}
                  value={lead.source}
                  onChange={(source) => updateLead(lead.id, { source: source as Lead['source'] })}
                />
              </td>
              <td className="px-4 py-3">
                <StatusSelect
                  options={LEAD_PRIORITIES}
                  value={lead.priority ?? 'Medium'}
                  onChange={(priority) => updateLead(lead.id, { priority: priority as Lead['priority'] })}
                />
              </td>
              <td className="px-4 py-3">
                <Cell
                  value={lead.company_size}
                  onChange={(company_size) => updateLead(lead.id, { company_size })}
                  width="w-20"
                />
              </td>
              <td className="px-4 py-3">
                <Cell value={lead.use_case} onChange={(use_case) => updateLead(lead.id, { use_case })} />
              </td>
              <td className="px-4 py-3">
                <RepSelect
                  reps={reps}
                  value={lead.assigned_rep_id}
                  onChange={(repId) => updateLead(lead.id, { assigned_rep_id: repId })}
                />
              </td>
              <td className="px-4 py-3">
                <StatusSelect
                  options={statuses}
                  value={lead.status}
                  onChange={(status) => updateLead(lead.id, { status: status as Lead['status'] })}
                />
              </td>
              <td className="px-4 py-3">
                <DeleteButton onDelete={() => deleteLead(lead.id)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
