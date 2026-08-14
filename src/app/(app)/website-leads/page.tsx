import { createClient } from '@/lib/supabase/server';
import { LEAD_STATUSES, type Rep, type WebsiteLead } from '@/lib/types';
import { WebsiteLeadsTable } from './table';

export default async function WebsiteLeadsPage() {
  const supabase = await createClient();

  const [{ data: leads }, { data: reps }] = await Promise.all([
    supabase
      .from('website_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .returns<WebsiteLead[]>(),
    supabase.from('reps').select('*').order('name').returns<Rep[]>()
  ]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-neutral-900">Website Leads</h1>
      <p className="mb-6 text-sm text-neutral-500">From the Framer site contact form.</p>
      <WebsiteLeadsTable leads={leads ?? []} reps={reps ?? []} statuses={LEAD_STATUSES} />
    </div>
  );
}
