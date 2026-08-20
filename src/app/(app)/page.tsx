import Link from 'next/link';
import { BarTrend } from '@/components/bar-trend';
import { BreakdownBars } from '@/components/breakdown-bars';
import { createClient } from '@/lib/supabase/server';
import { ACTIVITY_TYPES } from '@/lib/types';
import { InterestBreakdown } from './interest-breakdown';

const INTEREST_LABELS = [
  'Interested',
  'Meeting Booked',
  'Out of Office',
  'Not Interested',
  'Wrong Person',
  'No Reply Yet'
];

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: websiteCount },
    { count: instantlyCount },
    { count: linkedinCount },
    { count: interestedCount },
    { count: coldCallCount },
    { count: openDealsCount },
    { data: openDealsValueRows },
    { count: openFeedbackCount },
    { data: replyRows },
    { data: websiteLeadRows },
    { data: linkedinActivityRows },
    ...interestCounts
  ] = await Promise.all([
    supabase.from('website_leads').select('*', { count: 'exact', head: true }),
    supabase.from('instantly_leads').select('*', { count: 'exact', head: true }),
    supabase.from('linkedin_activity').select('*', { count: 'exact', head: true }),
    supabase
      .from('instantly_leads')
      .select('*', { count: 'exact', head: true })
      .eq('interest_status', 'Interested'),
    supabase
      .from('instantly_leads')
      .select('*', { count: 'exact', head: true })
      .eq('needs_cold_call', true),
    supabase.from('deals').select('*', { count: 'exact', head: true }).not('status', 'in', '("Won","Lost")'),
    supabase.from('deals').select('value').not('status', 'in', '("Won","Lost")'),
    supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .not('status', 'in', '("Resolved","Won\'t Fix")'),
    supabase.from('instantly_leads').select('last_reply_at').not('last_reply_at', 'is', null),
    supabase.from('website_leads').select('created_at'),
    supabase.from('linkedin_activity').select('activity'),
    ...INTEREST_LABELS.map((label) =>
      supabase
        .from('instantly_leads')
        .select('*', { count: 'exact', head: true })
        .eq('interest_status', label)
    )
  ]);

  const openDealsValue = (openDealsValueRows ?? []).reduce((sum, d) => sum + (d.value ?? 0), 0);

  const tiles = [
    { label: 'Leads', count: websiteCount ?? 0, href: '/leads' },
    { label: 'Instantly Leads', count: instantlyCount ?? 0, href: '/instantly-leads' },
    { label: 'Interested (Instantly)', count: interestedCount ?? 0, href: '/instantly-leads?filter=Interested' },
    { label: 'Needs Cold Call', count: coldCallCount ?? 0, href: '/instantly-leads?filter=All&coldCall=1' },
    { label: 'LinkedIn Activity Logged', count: linkedinCount ?? 0, href: '/linkedin-activity' },
    { label: 'Open Deals', count: openDealsCount ?? 0, href: '/deals' },
    { label: 'Open Pipeline Value', count: `$${openDealsValue.toLocaleString()}`, href: '/deals' },
    { label: 'Open Feedback', count: openFeedbackCount ?? 0, href: '/feedback' }
  ];

  const replyPoints = (replyRows ?? []).map((r) => ({ date: r.last_reply_at as string, value: 1 }));
  const websiteLeadPoints = (websiteLeadRows ?? []).map((r) => ({ date: r.created_at as string, value: 1 }));

  const interestBreakdown = INTEREST_LABELS.map((label, i) => ({
    label,
    count: interestCounts[i].count ?? 0
  }));

  const activityBreakdown = ACTIVITY_TYPES.map((type) => ({
    label: type,
    count: (linkedinActivityRows ?? []).filter((r) => r.activity === type).length
  }));

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-neutral-900">Dashboard</h1>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-neutral-300"
          >
            <p className="text-sm text-neutral-500">{tile.label}</p>
            <p className="mt-1 text-3xl font-semibold text-neutral-900">{tile.count}</p>
          </Link>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <BarTrend title="Instantly replies received" data={replyPoints} colorClass="bg-red-500" />
        <BarTrend title="Website leads received" data={websiteLeadPoints} colorClass="bg-blue-500" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InterestBreakdown counts={interestBreakdown} />
        <BreakdownBars title="LinkedIn activity by type" items={activityBreakdown} />
      </div>
    </div>
  );
}
