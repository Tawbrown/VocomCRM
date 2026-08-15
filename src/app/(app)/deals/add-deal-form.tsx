import { addDeal } from '@/app/actions';

export function AddDealForm() {
  return (
    <form
      action={addDeal}
      className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Customer name</label>
        <input
          name="customer_name"
          required
          className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Company</label>
        <input name="company" className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">PIC (point of contact)</label>
        <input name="pic" className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Product / Order</label>
        <input name="product" className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Value ($)</label>
        <input
          name="value"
          type="number"
          min="0"
          step="0.01"
          className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Start date</label>
        <input
          name="start_date"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Expected close</label>
        <input
          name="expected_close_date"
          type="date"
          className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900"
        />
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
          Add deal
        </button>
      </div>
    </form>
  );
}
