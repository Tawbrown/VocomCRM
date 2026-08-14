import { addLinkedInActivity } from '@/app/actions';
import { createClient } from '@/lib/supabase/server';
import { ACTIVITY_TYPES, DEAL_STATUSES, type LinkedInActivity, type Rep } from '@/lib/types';
import { LinkedInActivityTable } from './table';

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

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-neutral-900">LinkedIn Activity</h1>
      <p className="mb-6 text-sm text-neutral-500">
        LinkedIn doesn&apos;t expose followers/visits/likes via API, so this is logged manually —
        check LinkedIn&apos;s own notifications, then add what&apos;s new here.
      </p>

      <form
        action={addLinkedInActivity}
        className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Prospect</label>
          <input
            name="prospect"
            required
            className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Company</label>
          <input name="company" className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">LinkedIn URL</label>
          <input
            name="linkedin_url"
            className="w-56 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Activity</label>
          <select name="activity" className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm">
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Log activity
        </button>
      </form>

      <LinkedInActivityTable activity={activity ?? []} reps={reps ?? []} dealStatuses={DEAL_STATUSES} />
    </div>
  );
}
