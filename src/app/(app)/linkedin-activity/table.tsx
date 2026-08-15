'use client';

import { useTransition } from 'react';
import { deleteLinkedInActivity, updateLinkedInActivity } from '@/app/actions';
import { DeleteButton } from '@/components/delete-button';
import { RepSelect } from '@/components/rep-select';
import { StatusSelect } from '@/components/status-select';
import type { LinkedInActivity, Rep } from '@/lib/types';

function Toggle({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (checked: boolean) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <input
      type="checkbox"
      checked={checked}
      disabled={isPending}
      onChange={(e) => startTransition(() => onChange(e.target.checked))}
      className="h-4 w-4 rounded border-neutral-300"
    />
  );
}

export function LinkedInActivityTable({
  activity,
  reps,
  dealStatuses
}: {
  activity: LinkedInActivity[];
  reps: Rep[];
  dealStatuses: string[];
}) {
  if (activity.length === 0) {
    return <p className="text-sm text-neutral-500">Nothing logged yet — use the form above.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Prospect</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Activity</th>
            <th className="px-4 py-3 font-medium">Sent</th>
            <th className="px-4 py-3 font-medium">Accepted</th>
            <th className="px-4 py-3 font-medium">Assigned Rep</th>
            <th className="px-4 py-3 font-medium">Deal Status</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {activity.map((row) => (
            <tr key={row.id}>
              <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                {new Date(row.date_logged).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-neutral-900">
                {row.linkedin_url ? (
                  <a href={row.linkedin_url} target="_blank" rel="noreferrer" className="hover:underline">
                    {row.prospect}
                  </a>
                ) : (
                  row.prospect
                )}
              </td>
              <td className="px-4 py-3 text-neutral-600">{row.company || '—'}</td>
              <td className="px-4 py-3 text-neutral-600">{row.activity || '—'}</td>
              <td className="px-4 py-3">
                <Toggle
                  checked={row.connection_sent}
                  onChange={(checked) => updateLinkedInActivity(row.id, { connection_sent: checked })}
                />
              </td>
              <td className="px-4 py-3">
                <Toggle
                  checked={row.connection_accepted}
                  onChange={(checked) =>
                    updateLinkedInActivity(row.id, { connection_accepted: checked })
                  }
                />
              </td>
              <td className="px-4 py-3">
                <RepSelect
                  reps={reps}
                  value={row.assigned_rep_id}
                  onChange={(repId) => updateLinkedInActivity(row.id, { assigned_rep_id: repId })}
                />
              </td>
              <td className="px-4 py-3">
                <StatusSelect
                  options={dealStatuses}
                  value={row.deal_status}
                  onChange={(status) =>
                    updateLinkedInActivity(row.id, {
                      deal_status: status as LinkedInActivity['deal_status']
                    })
                  }
                />
              </td>
              <td className="px-4 py-3">
                <DeleteButton onDelete={() => deleteLinkedInActivity(row.id)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
