export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Won' | 'Lost';
export type DealStatus = 'Prospecting' | 'Connected' | 'Conversation' | 'Meeting' | 'Won' | 'Lost';
export type LinkedInActivityType = 'Follow' | 'Visit' | 'Like';

export const LEAD_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'];
export const DEAL_STATUSES: DealStatus[] = [
  'Prospecting',
  'Connected',
  'Conversation',
  'Meeting',
  'Won',
  'Lost'
];
export const ACTIVITY_TYPES: LinkedInActivityType[] = ['Follow', 'Visit', 'Like'];

export interface Rep {
  id: string;
  name: string;
}

export interface WebsiteLead {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  company: string | null;
  location: string | null;
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
  needs_cold_call: boolean;
  last_reply_at: string | null;
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
  source: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  linkedin_url: string | null;
  touched_at: string | null;
}
