import { createClient } from '@/lib/supabase/server';
import { LEAD_STATUSES, type InstantlyLead, type Rep } from '@/lib/types';
import { InstantlyLeadsTable } from './table';

export default async function InstantlyLeadsPage() {
  const supabase = await createClient();

  const [{ data: leads }, { data: reps }] = await Promise.all([
    supabase
      .from('instantly_leads')
      .select('*')
      .order('synced_at', { ascending: false })
      .returns<InstantlyLead[]>(),
    supabase.from('reps').select('*').order('name').returns<Rep[]>()
  ]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-neutral-900">Instantly Leads</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Synced hourly from your Instantly campaigns — interest status, phone, and LinkedIn come
        straight from Instantly&apos;s own reply classification.
      </p>
      <InstantlyLeadsTable leads={leads ?? []} reps={reps ?? []} statuses={LEAD_STATUSES} />
    </div>
  );
}
