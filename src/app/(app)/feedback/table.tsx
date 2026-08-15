'use client';

import { deleteFeedback, updateFeedbackStatus } from '@/app/actions';
import { DeleteButton } from '@/components/delete-button';
import { StatusSelect } from '@/components/status-select';
import type { Feedback, FeedbackStatus, Rep } from '@/lib/types';

export function FeedbackTable({ items, reps }: { items: Feedback[]; reps: Rep[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-neutral-500">No feedback submitted yet — use the form above.</p>;
  }

  const repName = (id: string | null) => reps.find((r) => r.id === id)?.name ?? '—';

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
          <tr>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Description</th>
            <th className="px-4 py-3 font-medium">Submitted By</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3 font-medium text-neutral-900">{item.title}</td>
              <td className="max-w-[320px] px-4 py-3 text-neutral-600">{item.description || '—'}</td>
              <td className="px-4 py-3 text-neutral-600">{repName(item.submitted_by_rep_id)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                {new Date(item.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <StatusSelect
                  options={['Open', 'In Progress', 'Resolved', "Won't Fix"]}
                  value={item.status}
                  onChange={(status) => updateFeedbackStatus(item.id, status as FeedbackStatus)}
                />
              </td>
              <td className="px-4 py-3">
                <DeleteButton onDelete={() => deleteFeedback(item.id)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
