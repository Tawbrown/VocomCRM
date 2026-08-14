import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/server';

// Parses LinkedIn's own Page Analytics exports (Followers / Visitors .xls downloads —
// Admin dashboard > Analytics > Followers or Visitors > Export). These only contain
// aggregate counts and demographics, never individual names (LinkedIn doesn't expose
// that data at all, covered elsewhere) — this is the closest thing to automated LinkedIn
// data this app can have.

const DEMOGRAPHIC_SHEETS = ['Location', 'Job function', 'Seniority', 'Industry', 'Company size'];

function sheetRows(workbook: XLSX.WorkBook, name: string): unknown[][] {
  const sheet = workbook.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
}

function findColumn(header: unknown[], match: (h: string) => boolean): number {
  return header.findIndex((h) => typeof h === 'string' && match(h));
}

// Parses LinkedIn's "MM/DD/YYYY" date strings directly instead of via `new Date()`, which
// is timezone-dependent and shifts the date by a day on negative-UTC-offset machines.
function excelDateToISO(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, month, day, year] = match;
  return `${year}-${month}-${day}`;
}

export async function POST(request: NextRequest) {
  // Requires a logged-in session (this route isn't in middleware's public matcher),
  // so only invited users can trigger a parse — mitigates xlsx's known ReDoS/prototype
  // pollution advisories, since only trusted admins can reach this endpoint.
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const followersFile = formData.get('followers') as File | null;
  const visitorsFile = formData.get('visitors') as File | null;

  const dailyStats = new Map<string, { new_followers: number; unique_visitors: number; page_views: number }>();
  const audienceRows: { source: string; category: string; label: string; value: number }[] = [];

  if (followersFile) {
    const wb = XLSX.read(await followersFile.arrayBuffer(), { type: 'array' });
    const rows = sheetRows(wb, 'New followers');
    const header = (rows[0] ?? []) as string[];
    const dateCol = findColumn(header, (h) => h === 'Date');
    const totalCol = findColumn(header, (h) => h === 'Total followers');
    for (const row of rows.slice(1)) {
      const date = excelDateToISO(row[dateCol]);
      const total = Number(row[totalCol]) || 0;
      if (!date) continue;
      const existing = dailyStats.get(date) ?? { new_followers: 0, unique_visitors: 0, page_views: 0 };
      existing.new_followers = total;
      dailyStats.set(date, existing);
    }

    for (const category of DEMOGRAPHIC_SHEETS) {
      const catRows = sheetRows(wb, category).slice(1);
      for (const row of catRows) {
        const label = row[0];
        const value = Number(row[1]) || 0;
        if (typeof label === 'string' && label) {
          audienceRows.push({ source: 'followers', category, label, value });
        }
      }
    }
  }

  if (visitorsFile) {
    const wb = XLSX.read(await visitorsFile.arrayBuffer(), { type: 'array' });
    const rows = sheetRows(wb, 'Visitor metrics');
    const header = (rows[0] ?? []) as string[];
    const dateCol = findColumn(header, (h) => h === 'Date');
    const visitorsCol = findColumn(header, (h) => h === 'Total unique visitors (total)');
    const viewsCol = findColumn(header, (h) => h === 'Total page views (total)');
    for (const row of rows.slice(1)) {
      const date = excelDateToISO(row[dateCol]);
      if (!date) continue;
      const existing = dailyStats.get(date) ?? { new_followers: 0, unique_visitors: 0, page_views: 0 };
      existing.unique_visitors = Number(row[visitorsCol]) || 0;
      existing.page_views = Number(row[viewsCol]) || 0;
      dailyStats.set(date, existing);
    }

    for (const category of DEMOGRAPHIC_SHEETS) {
      const catRows = sheetRows(wb, category).slice(1);
      for (const row of catRows) {
        const label = row[0];
        const value = Number(row[1]) || 0;
        if (typeof label === 'string' && label) {
          audienceRows.push({ source: 'visitors', category, label, value });
        }
      }
    }
  }

  if (dailyStats.size === 0 && audienceRows.length === 0) {
    return NextResponse.json({ error: 'no recognizable data in the uploaded file(s)' }, { status: 400 });
  }

  if (dailyStats.size > 0) {
    const upsertRows = Array.from(dailyStats.entries()).map(([date, stats]) => ({
      date,
      ...stats,
      updated_at: new Date().toISOString()
    }));
    const { error } = await supabase.from('linkedin_daily_stats').upsert(upsertRows, { onConflict: 'date' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (audienceRows.length > 0) {
    const sources = [...new Set(audienceRows.map((r) => r.source))];
    await supabase.from('linkedin_audience_stats').delete().in('source', sources);
    const { error } = await supabase.from('linkedin_audience_stats').insert(audienceRows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, days: dailyStats.size, audienceRows: audienceRows.length });
}
