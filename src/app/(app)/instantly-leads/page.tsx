import { createClient } from '@/lib/supabase/server';
import { LEAD_STATUSES, type InstantlyLead, type Rep } from '@/lib/types';
import { CAMPAIGN_STATUS_FILTERS, INTEREST_FILTERS, SEQUENCE_STATUS_FILTERS } from './constants';
import { InstantlyLeadsTable } from './table';

const PAGE_SIZE = 100;

export default async function InstantlyLeadsPage({
  searchParams
}: {
  searchParams: Promise<{
    filter?: string;
    coldCall?: string;
    campaignStatus?: string;
    sequenceStatus?: string;
    notStarted?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const filter = params.filter && INTEREST_FILTERS.includes(params.filter) ? params.filter : 'All';
  const campaignStatus =
    params.campaignStatus && CAMPAIGN_STATUS_FILTERS.includes(params.campaignStatus)
      ? params.campaignStatus
      : 'All';
  const sequenceStatus =
    params.sequenceStatus && SEQUENCE_STATUS_FILTERS.includes(params.sequenceStatus)
      ? params.sequenceStatus
      : 'All';
  const coldCallOnly = params.coldCall === '1';
  const notStartedOnly = params.notStarted === '1';
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);

  const supabase = await createClient();

  let query = supabase.from('instantly_leads').select('*', { count: 'exact' });
  if (filter !== 'All') query = query.eq('interest_status', filter);
  if (campaignStatus !== 'All') query = query.eq('campaign_status', campaignStatus);
  if (sequenceStatus !== 'All') query = query.eq('sequence_status', sequenceStatus);
  if (coldCallOnly) query = query.eq('needs_cold_call', true);
  if (notStartedOnly) query = query.is('last_contacted_at', null);
  query = query.order('synced_at', { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const [
    { data: leads, count },
    { data: reps },
    { count: coldCallCount },
    { count: totalCount },
    { count: activeCampaignCount },
    { count: completedCampaignCount },
    { count: notStartedCount },
    { count: awaitingReplyCount },
    { count: repliedCount },
    { count: sequenceCompleteNoReplyCount },
    ...filterCounts
  ] = await Promise.all([
    query.returns<InstantlyLead[]>(),
    supabase.from('reps').select('*').order('name').returns<Rep[]>(),
    supabase.from('instantly_leads').select('*', { count: 'exact', head: true }).eq('needs_cold_call', true),
    supabase.from('instantly_leads').select('*', { count: 'exact', head: true }),
    supabase.from('instantly_leads').select('*', { count: 'exact', head: true }).eq('campaign_status', 'Active'),
    supabase.from('instantly_leads').select('*', { count: 'exact', head: true }).eq('campaign_status', 'Completed'),
    supabase.from('instantly_leads').select('*', { count: 'exact', head: true }).is('last_contacted_at', null),
    supabase
      .from('instantly_leads')
      .select('*', { count: 'exact', head: true })
      .eq('sequence_status', 'Active')
      .not('last_contacted_at', 'is', null)
      .eq('interest_status', 'No Reply Yet'),
    supabase.from('instantly_leads').select('*', { count: 'exact', head: true }).not('last_reply_at', 'is', null),
    supabase
      .from('instantly_leads')
      .select('*', { count: 'exact', head: true })
      .eq('sequence_status', 'Completed')
      .eq('interest_status', 'No Reply Yet'),
    ...INTEREST_FILTERS.map((f) =>
      f === 'All'
        ? supabase.from('instantly_leads').select('*', { count: 'exact', head: true })
        : supabase.from('instantly_leads').select('*', { count: 'exact', head: true }).eq('interest_status', f)
    )
  ]);

  const filterCountByLabel = Object.fromEntries(
    INTEREST_FILTERS.map((f, i) => [f, filterCounts[i].count ?? 0])
  );

  const summary = {
    total: totalCount ?? 0,
    activeCampaigns: activeCampaignCount ?? 0,
    completedCampaigns: completedCampaignCount ?? 0,
    notStarted: notStartedCount ?? 0,
    awaitingReply: awaitingReplyCount ?? 0,
    replied: repliedCount ?? 0,
    sequenceCompleteNoReply: sequenceCompleteNoReplyCount ?? 0
  };

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
        campaignStatus={campaignStatus}
        sequenceStatus={sequenceStatus}
        coldCallOnly={coldCallOnly}
        notStartedOnly={notStartedOnly}
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={count ?? 0}
        coldCallCount={coldCallCount ?? 0}
        filterCounts={filterCountByLabel}
        summary={summary}
      />
    </div>
  );
}
