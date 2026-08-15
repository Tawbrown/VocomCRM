import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { InterestBreakdown } from './interest-breakdown';
import { ReplyTrendChart } from './reply-trend-chart';

const INTEREST_LABELS = [
  'Interested',
  'Meeting Booked',
  'Out of Office',
  'Not Interested',
  'Wrong Person',
  'Uncontacted'
];

function buildDailyCounts(dates: string[], days: number) {
  const counts = new Map<string, number>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    counts.set(d.toISOString().slice(0, 10), 0);
  }
  for (const raw of dates) {
    const day = raw.slice(0, 10);
    if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return [...counts.entries()].map(([date, count]) => ({ date, count }));
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: websiteCount },
    { count: instantlyCount },
    { count: linkedinCount },
    { count: interestedCount },
    { count: coldCallCount },
    { data: replyRows },
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
    supabase.from('instantly_leads').select('last_reply_at').not('last_reply_at', 'is', null),
    ...INTEREST_LABELS.map((label) =>
      supabase
        .from('instantly_leads')
        .select('*', { count: 'exact', head: true })
        .eq('interest_status', label)
    )
  ]);

  const tiles = [
    { label: 'Website Leads', count: websiteCount ?? 0, href: '/website-leads' },
    { label: 'Instantly Leads', count: instantlyCount ?? 0, href: '/instantly-leads' },
    { label: 'Interested (Instantly)', count: interestedCount ?? 0, href: '/instantly-leads?filter=Interested' },
    { label: 'Needs Cold Call', count: coldCallCount ?? 0, href: '/instantly-leads?filter=All&coldCall=1' },
    { label: 'LinkedIn Activity Logged', count: linkedinCount ?? 0, href: '/linkedin-activity' }
  ];

  const replyDates = (replyRows ?? []).map((r) => r.last_reply_at as string);
  const dailyCounts = buildDailyCounts(replyDates, 90);

  const interestBreakdown = INTEREST_LABELS.map((label, i) => ({
    label,
    count: interestCounts[i].count ?? 0
  }));

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-neutral-900">Dashboard</h1>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ReplyTrendChart dailyCounts={dailyCounts} />
        <InterestBreakdown counts={interestBreakdown} />
      </div>
    </div>
  );
}
