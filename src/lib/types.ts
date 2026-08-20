export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Won' | 'Lost';
export type LeadSource = 'Website' | 'Offline Event' | 'Referral' | 'Research' | 'Other';
export type DealStatus = 'Prospecting' | 'Connected' | 'Conversation' | 'Meeting' | 'Won' | 'Lost';
export type LinkedInActivityType = 'Follow' | 'Visit' | 'Like';

export const LEAD_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'];
export const LEAD_SOURCES: LeadSource[] = ['Website', 'Offline Event', 'Referral', 'Research', 'Other'];
export const DEAL_STATUSES: DealStatus[] = [
  'Prospecting',
  'Connected',
  'Conversation',
  'Meeting',
  'Won',
  'Lost'
];
export const ACTIVITY_TYPES: LinkedInActivityType[] = ['Follow', 'Visit', 'Like'];

export type DealPipelineStatus = 'Prospecting' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
export const DEAL_PIPELINE_STATUSES: DealPipelineStatus[] = [
  'Prospecting',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost'
];

export type FeedbackStatus = 'Open' | 'In Progress' | 'Resolved' | "Won't Fix";
export const FEEDBACK_STATUSES: FeedbackStatus[] = ['Open', 'In Progress', 'Resolved', "Won't Fix"];

export interface Rep {
  id: string;
  name: string;
}

export interface Lead {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  company: string | null;
  location: string | null;
  company_size: string | null;
  use_case: string | null;
  source: LeadSource;
  assigned_rep_id: string | null;
  status: LeadStatus;
  contacted_date: string | null;
  notes: string | null;
}

export interface InstantlyLead {
  id: string;
  synced_at: string;
  campaign: string | null;
  name: string | null;
  email: string;
  company: string | null;
  job_title: string | null;
  phone: string | null;
  linkedin_url: string | null;
  interest_status: string;
  assigned_rep_id: string | null;
  sales_status: LeadStatus;
  notes: string | null;
  reply_text: string | null;
  reply_phone: string | null;
  alternative_email: string | null;
  needs_cold_call: boolean;
  last_reply_at: string | null;
  campaign_status: string | null;
  sequence_status: string | null;
  last_contacted_at: string | null;
}

export interface LinkedInActivity {
  id: string;
  date_logged: string;
  prospect: string | null;
  company: string | null;
  linkedin_url: string | null;
  activity: LinkedInActivityType | null;
  connection_sent: boolean;
  connection_accepted: boolean;
  deal_status: DealStatus;
  assigned_rep_id: string | null;
  notes: string | null;
}

export interface LinkedInDailyStat {
  date: string;
  new_followers: number;
  unique_visitors: number;
  page_views: number;
}

export interface LinkedInAudienceStat {
  id: string;
  source: 'followers' | 'visitors';
  category: string;
  label: string;
  value: number;
}

export interface MasterContact {
  id: string;
  origin: 'website_leads' | 'instantly_leads' | 'linkedin_activity' | 'imported_contacts';
  source: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  linkedin_url: string | null;
  touched_at: string | null;
}

export interface SeoSearchQuery {
  id: string;
  date: string;
  query: string;
  page: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SeoDailyTotal {
  id: string;
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SeoLandingPage {
  id: string;
  date: string;
  page_path: string;
  sessions: number;
  active_users: number;
  conversions: number;
}

export interface ContentSuggestion {
  title: string;
  reason: string;
  based_on_query: string;
}

export interface Deal {
  id: string;
  customer_name: string;
  company: string | null;
  pic: string | null;
  product: string | null;
  value: number;
  status: DealPipelineStatus;
  start_date: string;
  expected_close_date: string | null;
  assigned_rep_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  title: string;
  description: string | null;
  submitted_by_rep_id: string | null;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  link: string | null;
  related_id: string | null;
  read: boolean;
  created_at: string;
}

export interface SeoMonthlyReport {
  id: string;
  month: string;
  summary: string;
  content_suggestions: ContentSuggestion[];
  stats: { opportunityCount?: number; queriesAnalyzed?: number };
  generated_at: string;
}
