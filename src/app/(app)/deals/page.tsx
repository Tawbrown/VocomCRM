import { createClient } from '@/lib/supabase/server';
import { DEAL_PIPELINE_STATUSES, type Deal, type Rep } from '@/lib/types';
import { AddDealForm } from './add-deal-form';
import { Gantt } from './gantt';
import { DealsTable } from './table';

export default async function DealsPage() {
  const supabase = await createClient();

  const [{ data: deals }, { data: reps }] = await Promise.all([
    supabase.from('deals').select('*').order('start_date', { ascending: true }).returns<Deal[]>(),
    supabase.from('reps').select('*').order('name').returns<Rep[]>()
  ]);

  const allDeals = deals ?? [];
  const openDeals = allDeals.filter((d) => d.status !== 'Won' && d.status !== 'Lost');
  const pipelineValue = openDeals.reduce((sum, d) => sum + d.value, 0);
  const wonValue = allDeals.filter((d) => d.status === 'Won').reduce((sum, d) => sum + d.value, 0);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-neutral-900">Deals</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Customer info, deal value, PIC, and product/order — visualized as a timeline plus a
        full editable table below.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-neutral-500">Open deals</p>
          <p className="mt-1 text-3xl font-semibold text-neutral-900">{openDeals.length}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-neutral-500">Open pipeline value</p>
          <p className="mt-1 text-3xl font-semibold text-neutral-900">${pipelineValue.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-neutral-500">Won value</p>
          <p className="mt-1 text-3xl font-semibold text-green-700">${wonValue.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-neutral-500">Total deals</p>
          <p className="mt-1 text-3xl font-semibold text-neutral-900">{allDeals.length}</p>
        </div>
      </div>

      <div className="mb-6">
        <Gantt deals={allDeals} />
      </div>

      <AddDealForm />

      <DealsTable deals={allDeals} reps={reps ?? []} statuses={DEAL_PIPELINE_STATUSES} />
    </div>
  );
}
