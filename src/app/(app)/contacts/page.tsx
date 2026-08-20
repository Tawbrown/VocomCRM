import { BreakdownBars } from '@/components/breakdown-bars';
import { createClient } from '@/lib/supabase/server';
import type { MasterContact } from '@/lib/types';
import { ImportForm } from './import-form';
import { ContactsTable } from './table';

const FIXED_SOURCES = [
  { label: 'Website', colorClass: 'bg-blue-500' },
  { label: 'Offline Event', colorClass: 'bg-purple-500' },
  { label: 'Referral', colorClass: 'bg-green-500' },
  { label: 'Research', colorClass: 'bg-amber-500' },
  { label: 'Other', colorClass: 'bg-neutral-400' },
  { label: 'Instantly', colorClass: 'bg-purple-700' },
  { label: 'LinkedIn Activity', colorClass: 'bg-sky-500' }
];

const PAGE_SIZE = 100;

export default async function ContactsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? '').trim();
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);

  const supabase = await createClient();

  let query = supabase.from('master_contacts').select('*', { count: 'exact' });
  if (q) {
    const escaped = q.replace(/[%_]/g, '\\$&');
    query = query.or(
      `name.ilike.%${escaped}%,email.ilike.%${escaped}%,company.ilike.%${escaped}%,phone.ilike.%${escaped}%,job_title.ilike.%${escaped}%,source.ilike.%${escaped}%`
    );
  }
  query = query.order('touched_at', { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const [{ data: contacts, count: totalCount }, { count: allCount }, ...sourceCounts] = await Promise.all([
    query.returns<MasterContact[]>(),
    supabase.from('master_contacts').select('*', { count: 'exact', head: true }),
    ...FIXED_SOURCES.map((s) =>
      supabase.from('master_contacts').select('*', { count: 'exact', head: true }).eq('source', s.label)
    )
  ]);

  const fixedTotal = sourceCounts.reduce((sum, c) => sum + (c.count ?? 0), 0);
  const importedCount = Math.max(0, (allCount ?? 0) - fixedTotal);

  const sourceBreakdown = [
    ...FIXED_SOURCES.map((s, i) => ({ label: s.label, count: sourceCounts[i].count ?? 0, colorClass: s.colorClass })),
    { label: 'Imported (CSV)', count: importedCount, colorClass: 'bg-neutral-500' }
  ];

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-neutral-900">Contacts</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Every contact this CRM has ever touched — leads, Instantly leads, LinkedIn activity,
        and anything imported below (Hunter.io exports, LinkedIn Sales Navigator lists,
        etc). Not deduplicated across sources — same person from two places shows twice,
        tagged by source.
      </p>

      <div className="mb-6 max-w-md">
        <BreakdownBars title={`By source (${(allCount ?? 0).toLocaleString()} total)`} items={sourceBreakdown} />
      </div>

      <ImportForm />

      <ContactsTable
        contacts={contacts ?? []}
        totalCount={totalCount ?? 0}
        page={page}
        pageSize={PAGE_SIZE}
        query={q}
      />
    </div>
  );
}
