import { addAccount } from '@/app/actions';
import type { Rep } from '@/lib/types';

export function AddAccountForm({ reps }: { reps: Rep[] }) {
  return (
    <form
      action={addAccount}
      className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Name</label>
        <input
          name="name"
          required
          className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">HQ</label>
        <input name="hq" className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Website</label>
        <input name="website" className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Industry</label>
        <input name="industry" className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Company size</label>
        <input
          name="company_size"
          className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Assigned rep</label>
        <select
          name="assigned_rep_id"
          className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900"
        >
          <option value="">Unassigned</option>
          {reps.map((rep) => (
            <option key={rep.id} value={rep.id}>
              {rep.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Notes</label>
        <input name="notes" className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900" />
      </div>
      <div className="sm:col-span-2 lg:col-span-4">
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Add account
        </button>
      </div>
    </form>
  );
}
