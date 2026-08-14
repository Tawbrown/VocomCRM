import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ count: websiteCount }, { count: instantlyCount }, { count: linkedinCount }, { count: interestedCount }] =
    await Promise.all([
      supabase.from('website_leads').select('*', { count: 'exact', head: true }),
      supabase.from('instantly_leads').select('*', { count: 'exact', head: true }),
      supabase.from('linkedin_activity').select('*', { count: 'exact', head: true }),
      supabase
        .from('instantly_leads')
        .select('*', { count: 'exact', head: true })
        .eq('interest_status', 'Interested')
    ]);

  const tiles = [
    { label: 'Website Leads', count: websiteCount ?? 0, href: '/website-leads' },
    { label: 'Instantly Leads', count: instantlyCount ?? 0, href: '/instantly-leads' },
    { label: 'Interested (Instantly)', count: interestedCount ?? 0, href: '/instantly-leads' },
    { label: 'LinkedIn Activity Logged', count: linkedinCount ?? 0, href: '/linkedin-activity' }
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-neutral-900">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
    </div>
  );
}
