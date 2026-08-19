'use client';

import { deleteWebsiteLead, updateWebsiteLead } from '@/app/actions';
import { DeleteButton } from '@/components/delete-button';
import { RepSelect } from '@/components/rep-select';
import { StatusSelect } from '@/components/status-select';
import type { Rep, WebsiteLead } from '@/lib/types';
import { useHighlightRow } from '@/lib/use-highlight-row';

export function WebsiteLeadsTable({
  leads,
  reps,
  statuses
}: {
  leads: WebsiteLead[];
  reps: Rep[];
  statuses: string[];
}) {
  const { rowProps } = useHighlightRow();

  if (leads.length === 0) {
    return <p className="text-sm text-neutral-500">No website leads yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Company</th>
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
              <td className="px-4 py-3 text-neutral-900">{lead.name || '—'}</td>
              <td className="px-4 py-3 text-neutral-600">{lead.email || '—'}</td>
              <td className="px-4 py-3 text-neutral-600">{lead.company || '—'}</td>
              <td className="px-4 py-3 text-neutral-600">{lead.company_size || '—'}</td>
              <td className="px-4 py-3 text-neutral-600">{lead.use_case || '—'}</td>
              <td className="px-4 py-3">
                <RepSelect
                  reps={reps}
                  value={lead.assigned_rep_id}
                  onChange={(repId) => updateWebsiteLead(lead.id, { assigned_rep_id: repId })}
                />
              </td>
              <td className="px-4 py-3">
                <StatusSelect
                  options={statuses}
                  value={lead.status}
                  onChange={(status) =>
                    updateWebsiteLead(lead.id, { status: status as WebsiteLead['status'] })
                  }
                />
              </td>
              <td className="px-4 py-3">
                <DeleteButton onDelete={() => deleteWebsiteLead(lead.id)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
