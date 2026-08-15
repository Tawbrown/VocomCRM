import { BarTrend } from '@/components/bar-trend';
import { createClient } from '@/lib/supabase/server';
import type { LinkedInAudienceStat, LinkedInDailyStat } from '@/lib/types';
import { AudienceBreakdown } from './audience-breakdown';
import { UploadForm } from './upload-form';

export default async function LinkedInMarketingPage() {
  const supabase = await createClient();

  const [{ data: dailyStats }, { data: audienceStats }] = await Promise.all([
    supabase.from('linkedin_daily_stats').select('*').order('date').returns<LinkedInDailyStat[]>(),
    supabase.from('linkedin_audience_stats').select('*').returns<LinkedInAudienceStat[]>()
  ]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-neutral-900">LinkedIn Marketing Data</h1>
      <p className="mb-6 text-sm text-neutral-500">
        LinkedIn only lets you export aggregate counts and demographics, not names — get
        these from your Page admin: Analytics &rarr; Followers / Visitors &rarr; Export.
        Upload the same files again later to add new days; existing days get updated, not
        duplicated.
      </p>

      <UploadForm />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <BarTrend
          title="New followers"
          data={(dailyStats ?? []).map((s) => ({ date: s.date, value: s.new_followers }))}
          colorClass="bg-blue-500"
        />
        <BarTrend
          title="Unique visitors"
          data={(dailyStats ?? []).map((s) => ({ date: s.date, value: s.unique_visitors }))}
          colorClass="bg-green-500"
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-neutral-900">Follower demographics</h2>
      <div className="mb-6">
        <AudienceBreakdown stats={audienceStats ?? []} source="followers" />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-neutral-900">Visitor demographics</h2>
      <AudienceBreakdown stats={audienceStats ?? []} source="visitors" />
    </div>
  );
}
