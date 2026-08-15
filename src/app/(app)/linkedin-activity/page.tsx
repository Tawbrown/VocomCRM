import { addLinkedInActivity } from '@/app/actions';
import { BreakdownBars } from '@/components/breakdown-bars';
import { createClient } from '@/lib/supabase/server';
import { ACTIVITY_TYPES, DEAL_STATUSES, type LinkedInActivity, type Rep } from '@/lib/types';
import { LinkedInActivityTable } from './table';

const DEAL_COLORS: Record<string, string> = {
  Prospecting: 'bg-neutral-500',
  Connected: 'bg-blue-500',
  Conversation: 'bg-amber-500',
  Meeting: 'bg-purple-500',
  Won: 'bg-green-500',
  Lost: 'bg-red-400'
};

export default async function LinkedInActivityPage() {
  const supabase = await createClient();

  const [{ data: activity }, { data: reps }] = await Promise.all([
    supabase
      .from('linkedin_activity')
      .select('*')
      .order('date_logged', { ascending: false })
      .returns<LinkedInActivity[]>(),
    supabase.from('reps').select('*').order('name').returns<Rep[]>()
  ]);

  const allActivity = activity ?? [];
  const activityTypeBreakdown = ACTIVITY_TYPES.map((type) => ({
    label: type,
    count: allActivity.filter((a) => a.activity === type).length
  }));
  const dealBreakdown = DEAL_STATUSES.map((status) => ({
    label: status,
    count: allActivity.filter((a) => a.deal_status === status).length,
    colorClass: DEAL_COLORS[status]
  }));
  const sentCount = allActivity.filter((a) => a.connection_sent).length;
  const acceptedCount = allActivity.filter((a) => a.connection_accepted).length;

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-neutral-900">LinkedIn Activity</h1>
      <p className="mb-6 text-sm text-neutral-500">
        LinkedIn doesn&apos;t expose followers/visits/likes via API, so this is logged manually —
        check LinkedIn&apos;s own notifications, then add what&apos;s new here.
      </p>

      {allActivity.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <BreakdownBars title="Activity type" items={activityTypeBreakdown} />
          <BreakdownBars title="Deal status" items={dealBreakdown} />
          <BreakdownBars
            title="Connection funnel"
            items={[
              { label: 'Logged', count: allActivity.length, colorClass: 'bg-neutral-500' },
              { label: 'Sent', count: sentCount, colorClass: 'bg-blue-500' },
              { label: 'Accepted', count: acceptedCount, colorClass: 'bg-green-500' }
            ]}
          />
        </div>
      )}

      <form
        action={addLinkedInActivity}
        className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
      >
        <div className="w-full sm:w-auto">
          <label className="mb-1 block text-xs font-medium text-neutral-500">Prospect</label>
          <input
            name="prospect"
            required
            className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm sm:w-auto"
          />
        </div>
        <div className="w-full sm:w-auto">
          <label className="mb-1 block text-xs font-medium text-neutral-500">Company</label>
          <input
            name="company"
            className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm sm:w-auto"
          />
        </div>
        <div className="w-full sm:w-auto">
          <label className="mb-1 block text-xs font-medium text-neutral-500">LinkedIn URL</label>
          <input
            name="linkedin_url"
            className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm sm:w-56"
          />
        </div>
        <div className="w-full sm:w-auto">
          <label className="mb-1 block text-xs font-medium text-neutral-500">Activity</label>
          <select
            name="activity"
            className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm sm:w-auto"
          >
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 sm:w-auto"
        >
          Log activity
        </button>
      </form>

      <LinkedInActivityTable activity={allActivity} reps={reps ?? []} dealStatuses={DEAL_STATUSES} />
    </div>
  );
}
