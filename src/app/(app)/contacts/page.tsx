import { createClient } from '@/lib/supabase/server';
import type { MasterContact } from '@/lib/types';
import { ImportForm } from './import-form';
import { ContactsTable } from './table';

export default async function ContactsPage() {
  const supabase = await createClient();
  const { data: contacts } = await supabase
    .from('master_contacts')
    .select('*')
    .order('touched_at', { ascending: false })
    .returns<MasterContact[]>();

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-neutral-900">Contacts</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Every contact this CRM has ever touched — website leads, Instantly leads, LinkedIn
        activity, and anything imported below (Hunter.io exports, LinkedIn Sales Navigator
        lists, etc). Not deduplicated across sources — same person from two places shows
        twice, tagged by source.
      </p>

      <ImportForm />

      <ContactsTable contacts={contacts ?? []} />
    </div>
  );
}
