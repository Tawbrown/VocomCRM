import { createClient } from '@/lib/supabase/server';
import type { Account, Deal } from '@/lib/types';
import { SalesDashboardClient } from './sales-dashboard-client';

export default async function SalesDashboardPage() {
  const supabase = await createClient();

  const [{ data: deals }, { data: accounts }] = await Promise.all([
    supabase.from('deals').select('*').returns<Deal[]>(),
    supabase.from('accounts').select('*').returns<Account[]>()
  ]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-neutral-900">Sales Dashboard</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Pipeline value, revenue, and breakdowns across the sales team. Built on our own
        deal data — see each component&apos;s title for exactly what it includes.
      </p>
      <SalesDashboardClient deals={deals ?? []} accounts={accounts ?? []} />
    </div>
  );
}
