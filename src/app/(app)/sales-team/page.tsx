import { addRep } from '@/app/actions';
import { createClient } from '@/lib/supabase/server';
import type { Rep } from '@/lib/types';

export default async function SalesTeamPage() {
  const supabase = await createClient();
  const { data: reps } = await supabase.from('reps').select('*').order('name').returns<Rep[]>();

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
          <input name="name" required className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm" />
        </div>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Add rep
        </button>
      </form>

      <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white shadow-sm">
        {(reps ?? []).map((rep) => (
          <li key={rep.id} className="px-4 py-3 text-sm text-neutral-900">
            {rep.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
