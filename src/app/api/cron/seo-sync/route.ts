import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAnalyticsDataClient, getSearchConsoleClient } from '@/lib/google';
import { createAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 120;

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Google API client errors (gaxios) don't stringify usefully by default — pull out the
// actual message so failures are diagnosable instead of showing "[object Object]".
function describeError(err: unknown): string {
  if (err instanceof Error) {
    const anyErr = err as Error & { response?: { data?: unknown }; code?: string | number };
    const responseData = anyErr.response?.data;
    if (responseData) {
      try {
        return `${err.message} — ${JSON.stringify(responseData)}`;
      } catch {
        // fall through
      }
    }
    return err.message;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

async function syncSearchConsole(supabase: ReturnType<typeof createAdminClient>) {
  const siteUrl = process.env.GSC_SITE_URL;
  if (!siteUrl) return { skipped: 'GSC_SITE_URL not set' };

  const searchconsole = await getSearchConsoleClient();
  const end = new Date();
  end.setDate(end.getDate() - 3); // GSC data has a ~2-3 day lag
  const start = new Date(end);
  start.setDate(start.getDate() - 6); // pull a week each run, overlap is fine (upsert)

  const res = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: isoDate(start),
      endDate: isoDate(end),
      dimensions: ['date', 'query', 'page'],
      rowLimit: 5000
    }
  });

  const rows = (res.data.rows ?? []).map((row) => ({
    date: row.keys?.[0],
    query: row.keys?.[1],
    page: row.keys?.[2],
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0
  }));

  if (rows.length > 0) {
    const { error } = await supabase
      .from('seo_search_queries')
      .upsert(rows, { onConflict: 'date,query,page' });
    if (error) throw error;
  }

  return { rows: rows.length };
}

async function syncAnalytics(supabase: ReturnType<typeof createAdminClient>) {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) return { skipped: 'GA4_PROPERTY_ID not set' };

  const analyticsdata = await getAnalyticsDataClient();
  const res = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: '8daysAgo', endDate: 'yesterday' }],
      dimensions: [{ name: 'date' }, { name: 'landingPage' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'conversions' }]
    }
  });

  const rows = (res.data.rows ?? []).map((row) => {
    const raw = row.dimensionValues?.[0]?.value ?? '';
    const date = raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw;
    return {
      date,
      page_path: row.dimensionValues?.[1]?.value ?? '',
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
      active_users: Number(row.metricValues?.[1]?.value ?? 0),
      conversions: Number(row.metricValues?.[2]?.value ?? 0)
    };
  });

  if (rows.length > 0) {
    const { error } = await supabase
      .from('seo_landing_pages')
      .upsert(rows, { onConflict: 'date,page_path' });
    if (error) throw error;
  }

  return { rows: rows.length };
}

async function maybeGenerateMonthlyReport(supabase: ReturnType<typeof createAdminClient>) {
  const now = new Date();
  const monthStart = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));

  const { data: existing } = await supabase
    .from('seo_monthly_reports')
    .select('id')
    .eq('month', monthStart)
    .maybeSingle();
  if (existing) return { skipped: 'already generated for this month' };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { skipped: 'GEMINI_API_KEY not set' };

  // Opportunity queries: decent visibility (impressions) but weak clicks or ranking —
  // the classic "close but not converting" signal worth writing/optimizing content for.
  const since = isoDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000));
  const { data: queries } = await supabase
    .from('seo_search_queries')
    .select('query, page, clicks, impressions, ctr, position')
    .gte('date', since)
    .order('impressions', { ascending: false })
    .limit(2000);

  if (!queries || queries.length === 0) return { skipped: 'no search query data yet' };

  const byQuery = new Map<string, { impressions: number; clicks: number; position: number; page: string | null }>();
  for (const row of queries) {
    const existing = byQuery.get(row.query) ?? { impressions: 0, clicks: 0, position: 0, page: row.page };
    existing.impressions += row.impressions;
    existing.clicks += row.clicks;
    existing.position = row.position; // most recent occurrence is fine for a rough signal
    byQuery.set(row.query, existing);
  }

  const opportunities = [...byQuery.entries()]
    .map(([query, stats]) => ({ query, ...stats }))
    .filter((q) => q.impressions >= 20 && q.position >= 8) // visible, but not ranking well
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 30);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });
  const result = await model.generateContent(
    `You're advising Vocom, a fiber optic cable supplier, on SEO content strategy. Here is the last 90 days of Google Search Console query data — queries getting search impressions but ranking outside the top few spots (position 8+) or with weak click-through:

${JSON.stringify(opportunities, null, 2)}

Write a concise monthly content report with two parts:
1. A short summary (3-5 sentences) of the biggest opportunity themes you see.
2. A list of 5-8 specific blog post title suggestions, each tied to a real query above, with a one-line reason.

Respond as JSON only, matching this shape: {"summary": string, "suggestions": [{"title": string, "reason": string, "based_on_query": string}]}`
  );

  const text = result.response.text();
  let parsed: { summary: string; suggestions: unknown[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { summary: text || 'Could not parse report.', suggestions: [] };
  }

  const { error } = await supabase.from('seo_monthly_reports').insert({
    month: monthStart,
    summary: parsed.summary ?? '',
    content_suggestions: parsed.suggestions ?? [],
    stats: { opportunityCount: opportunities.length, queriesAnalyzed: byQuery.size }
  });
  if (error) throw error;

  return { generated: true };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results: Record<string, unknown> = {};

  try {
    results.searchConsole = await syncSearchConsole(supabase);
  } catch (err) {
    console.error('Search Console sync failed:', err);
    results.searchConsole = { error: describeError(err) };
  }

  try {
    results.analytics = await syncAnalytics(supabase);
  } catch (err) {
    console.error('Analytics sync failed:', err);
    results.analytics = { error: describeError(err) };
  }

  try {
    results.monthlyReport = await maybeGenerateMonthlyReport(supabase);
  } catch (err) {
    console.error('Monthly report generation failed:', err);
    results.monthlyReport = { error: describeError(err) };
  }

  return NextResponse.json({ ok: true, ...results });
}
