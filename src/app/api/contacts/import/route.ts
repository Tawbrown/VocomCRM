import { NextRequest, NextResponse } from 'next/server';
import { parseContactsCsv } from '@/lib/csv';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const source = ((formData.get('source') as string) || 'Imported').trim();

  if (!file) return NextResponse.json({ error: 'no file provided' }, { status: 400 });

  const text = await file.text();
  const contacts = parseContactsCsv(text);

  if (contacts.length === 0) {
    return NextResponse.json({ error: 'no rows found — check the file has a header row' }, { status: 400 });
  }

  const rows = contacts.map((c) => ({ ...c, source }));
  const { error } = await supabase.from('imported_contacts').insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, imported: rows.length });
}
