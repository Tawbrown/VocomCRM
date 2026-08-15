import { createClient } from '@/lib/supabase/server';
import { LEAD_STATUSES, type InstantlyLead, type Rep } from '@/lib/types';
import { INTEREST_FILTERS } from './constants';
import { InstantlyLeadsTable } from './table';

const PAGE_SIZE = 100;

export default async function InstantlyLeadsPage({
  searchParams
}: {
  searchParams: Promise<{ filter?: string; coldCall?: string; page?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter && INTEREST_FILTERS.includes(params.filter) ? params.filter : 'All';
  const coldCallOnly = params.coldCall === '1';
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);

  const supabase = await createClient();

  let query = supabase.from('instantly_leads').select('*', { count: 'exact' });
  if (filter !== 'All') query = query.eq('interest_status', filter);
  if (coldCallOnly) query = query.eq('needs_cold_call', true);
  query = query.order('synced_at', { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const [{ data: leads, count }, { data: reps }, { count: coldCallCount }, ...filterCounts] = await Promise.all([
    query.returns<InstantlyLead[]>(),
    supabase.from('reps').select('*').order('name').returns<Rep[]>(),
    supabase.from('instantly_leads').select('*', { count: 'exact', head: true }).eq('needs_cold_call', true),
    ...INTEREST_FILTERS.map((f) =>
      f === 'All'
        ? supabase.from('instantly_leads').select('*', { count: 'exact', head: true })
        : supabase.from('instantly_leads').select('*', { count: 'exact', head: true }).eq('interest_status', f)
    )
  ]);

  const filterCountByLabel = Object.fromEntries(
    INTEREST_FILTERS.map((f, i) => [f, filterCounts[i].count ?? 0])
  );

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-neutral-900">Instantly Leads</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Synced daily from your Instantly campaigns — interest status, phone, and LinkedIn
        come straight from Instantly&apos;s own reply classification.
      </p>
      <InstantlyLeadsTable
        leads={leads ?? []}
        reps={reps ?? []}
        statuses={LEAD_STATUSES}
        filter={filter}
        coldCallOnly={coldCallOnly}
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={count ?? 0}
        coldCallCount={coldCallCount ?? 0}
        filterCounts={filterCountByLabel}
      />
    </div>
  );
}
