import { addFeedback } from '@/app/actions';
import type { Rep } from '@/lib/types';

export function AddFeedbackForm({ reps }: { reps: Rep[] }) {
  return (
    <form
      action={addFeedback}
      className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="lg:col-span-2">
        <label className="mb-1 block text-xs font-medium text-neutral-500">Title</label>
        <input
          name="title"
          required
          placeholder="e.g. Add CSV export to Instantly Leads"
          className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Submitted by</label>
        <select
          name="submitted_by_rep_id"
          className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900"
        >
          <option value="">Unspecified</option>
          {reps.map((rep) => (
            <option key={rep.id} value={rep.id}>
              {rep.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <button
          type="submit"
          className="w-full rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Submit feedback
        </button>
      </div>
      <div className="lg:col-span-4">
        <label className="mb-1 block text-xs font-medium text-neutral-500">Description</label>
        <textarea
          name="description"
          rows={2}
          className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900"
        />
      </div>
    </form>
  );
}
