import { createClient } from '@/lib/supabase/server';
import type { Account, AccountContact, Deal, Rep } from '@/lib/types';
import { AddAccountForm } from './add-account-form';
import { AccountsTable } from './table';

export default async function AccountsPage() {
  const supabase = await createClient();

  const [{ data: accounts }, { data: reps }, { data: contacts }, { data: deals }] = await Promise.all([
    supabase.from('accounts').select('*').order('name').returns<Account[]>(),
    supabase.from('reps').select('*').order('name').returns<Rep[]>(),
    supabase.from('account_contacts').select('id, account_id').returns<Pick<AccountContact, 'id' | 'account_id'>[]>(),
    supabase.from('deals').select('id, account_id').returns<Pick<Deal, 'id' | 'account_id'>[]>()
  ]);

  const allAccounts = accounts ?? [];

  const contactCounts: Record<string, number> = {};
  (contacts ?? []).forEach((c) => {
    contactCounts[c.account_id] = (contactCounts[c.account_id] ?? 0) + 1;
  });

  const dealCounts: Record<string, number> = {};
  (deals ?? []).forEach((d) => {
    if (d.account_id) dealCounts[d.account_id] = (dealCounts[d.account_id] ?? 0) + 1;
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-neutral-900">Accounts</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Company-level records. Each account can have its own contacts and deals — link deals and
        leads to an account as you work them.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-neutral-500">Total accounts</p>
          <p className="mt-1 text-3xl font-semibold text-neutral-900">{allAccounts.length}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-neutral-500">Linked deals</p>
          <p className="mt-1 text-3xl font-semibold text-neutral-900">
            {(deals ?? []).filter((d) => d.account_id).length}
          </p>
        </div>
      </div>

      <AddAccountForm reps={reps ?? []} />

      <AccountsTable accounts={allAccounts} reps={reps ?? []} contactCounts={contactCounts} dealCounts={dealCounts} />
    </div>
  );
}
