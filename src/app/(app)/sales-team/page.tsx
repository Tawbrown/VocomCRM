import { addRep } from '@/app/actions';
import { BreakdownBars } from '@/components/breakdown-bars';
import { createClient } from '@/lib/supabase/server';
import type { Rep } from '@/lib/types';

export default async function SalesTeamPage() {
  const supabase = await createClient();
  const { data: reps } = await supabase.from('reps').select('*').order('name').returns<Rep[]>();
  const allReps = reps ?? [];

  const [{ data: websiteAssignments }, { data: instantlyAssignments }, { data: linkedinAssignments }] =
    await Promise.all([
      supabase.from('website_leads').select('assigned_rep_id').not('assigned_rep_id', 'is', null),
      supabase.from('instantly_leads').select('assigned_rep_id').not('assigned_rep_id', 'is', null),
      supabase.from('linkedin_activity').select('assigned_rep_id').not('assigned_rep_id', 'is', null)
    ]);

  const allAssignments = [
    ...(websiteAssignments ?? []),
    ...(instantlyAssignments ?? []),
    ...(linkedinAssignments ?? [])
  ];

  const workload = allReps.map((rep) => ({
    label: rep.name,
    count: allAssignments.filter((a) => a.assigned_rep_id === rep.id).length
  }));

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-neutral-900">Sales Team</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Add a rep here and they immediately show up in every Assigned Rep dropdown.
      </p>

      <form
        action={addRep}
        className="mb-6 flex items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Rep name</label>
          <input name="name" required className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900" />
        </div>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Add rep
        </button>
      </form>

      {allReps.length > 0 && (
        <div className="mb-6 max-w-md">
          <BreakdownBars title="Leads assigned per rep (all sources)" items={workload} />
        </div>
      )}

      <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white shadow-sm">
        {allReps.map((rep) => (
          <li key={rep.id} className="px-4 py-3 text-sm text-neutral-900">
            {rep.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
