import { BreakdownBars } from '@/components/breakdown-bars';
import { createClient } from '@/lib/supabase/server';
import { FEEDBACK_STATUSES, type Feedback, type Rep } from '@/lib/types';
import { AddFeedbackForm } from './add-feedback-form';
import { FeedbackTable } from './table';

const STATUS_COLORS: Record<string, string> = {
  Open: 'bg-neutral-500',
  'In Progress': 'bg-blue-500',
  Resolved: 'bg-green-500',
  "Won't Fix": 'bg-red-400'
};

export default async function FeedbackPage() {
  const supabase = await createClient();

  const [{ data: items }, { data: reps }] = await Promise.all([
    supabase.from('feedback').select('*').order('created_at', { ascending: false }).returns<Feedback[]>(),
    supabase.from('reps').select('*').order('name').returns<Rep[]>()
  ]);

  const allItems = items ?? [];
  const breakdown = FEEDBACK_STATUSES.map((status) => ({
    label: status,
    count: allItems.filter((i) => i.status === status).length,
    colorClass: STATUS_COLORS[status]
  }));

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-neutral-900">Feedback</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Feature requests and fixes for this CRM — tag who submitted it, track status.
      </p>

      {allItems.length > 0 && (
        <div className="mb-6 max-w-md">
          <BreakdownBars title="By status" items={breakdown} />
        </div>
      )}

      <AddFeedbackForm reps={reps ?? []} />

      <FeedbackTable items={allItems} reps={reps ?? []} />
    </div>
  );
}
