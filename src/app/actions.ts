'use server';

import { revalidatePath } from 'next/cache';
import { runInstantlySync } from '@/lib/instantly-sync';
import { createClient } from '@/lib/supabase/server';
import type {
  DealPipelineStatus,
  DealStatus,
  FeedbackStatus,
  LeadPriority,
  LeadSource,
  LeadStatus,
  LinkedInActivityType,
  Notification
} from '@/lib/types';

export async function triggerInstantlySync() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const result = await runInstantlySync();
  revalidatePath('/instantly-leads');
  return result;
}

async function repName(supabase: Awaited<ReturnType<typeof createClient>>, repId: string) {
  const { data } = await supabase.from('reps').select('name').eq('id', repId).maybeSingle();
  return data?.name ?? 'Someone';
}

async function notifyAssignment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  repId: string,
  entityLabel: string,
  recordLabel: string,
  link: string,
  relatedId: string
) {
  const rep = await repName(supabase, repId);
  await supabase.from('notifications').insert({
    type: 'assignment',
    title: `${rep} was assigned to ${entityLabel}: ${recordLabel}`,
    link,
    related_id: relatedId
  });
}

export async function updateLead(
  id: string,
  fields: Partial<{
    assigned_rep_id: string | null;
    status: LeadStatus;
    source: LeadSource;
    priority: LeadPriority | null;
    job_title: string;
    phone: string;
    linkedin_url: string;
    notes: string;
    contacted_date: string | null;
    deal_id: string | null;
  }>
) {
  const supabase = await createClient();
  const { data: updated } = await supabase
    .from('website_leads')
    .update(fields)
    .eq('id', id)
    .select('name, company')
    .maybeSingle();
  if (fields.assigned_rep_id) {
    await notifyAssignment(
      supabase,
      fields.assigned_rep_id,
      'lead',
      updated?.name || updated?.company || 'a lead',
      '/leads',
      id
    );
  }
  revalidatePath('/leads');
}

export async function updateInstantlyLead(
  id: string,
  fields: Partial<{ assigned_rep_id: string | null; sales_status: LeadStatus; notes: string }>
) {
  const supabase = await createClient();
  const { data: updated } = await supabase
    .from('instantly_leads')
    .update(fields)
    .eq('id', id)
    .select('name, company')
    .maybeSingle();
  if (fields.assigned_rep_id) {
    await notifyAssignment(
      supabase,
      fields.assigned_rep_id,
      'Instantly lead',
      updated?.name || updated?.company || 'a lead',
      '/instantly-leads',
      id
    );
  }
  revalidatePath('/instantly-leads');
}

export async function updateLinkedInActivity(
  id: string,
  fields: Partial<{
    assigned_rep_id: string | null;
    deal_status: DealStatus;
    connection_sent: boolean;
    connection_accepted: boolean;
    notes: string;
  }>
) {
  const supabase = await createClient();
  const { data: updated } = await supabase
    .from('linkedin_activity')
    .update(fields)
    .eq('id', id)
    .select('prospect, company')
    .maybeSingle();
  if (fields.assigned_rep_id) {
    await notifyAssignment(
      supabase,
      fields.assigned_rep_id,
      'LinkedIn activity',
      updated?.prospect || updated?.company || 'a contact',
      '/linkedin-activity',
      id
    );
  }
  revalidatePath('/linkedin-activity');
}

export async function addLinkedInActivity(formData: FormData) {
  const supabase = await createClient();
  await supabase.from('linkedin_activity').insert({
    prospect: formData.get('prospect') as string,
    company: formData.get('company') as string,
    linkedin_url: formData.get('linkedin_url') as string,
    activity: formData.get('activity') as LinkedInActivityType
  });
  revalidatePath('/linkedin-activity');
}

export async function addRep(formData: FormData) {
  const supabase = await createClient();
  const name = (formData.get('name') as string)?.trim();
  if (!name) return;
  await supabase.from('reps').insert({ name });
  revalidatePath('/sales-team');
}

export async function deleteLead(id: string) {
  const supabase = await createClient();
  await supabase.from('website_leads').delete().eq('id', id);
  revalidatePath('/leads');
}

export async function deleteInstantlyLead(id: string) {
  const supabase = await createClient();
  await supabase.from('instantly_leads').delete().eq('id', id);
  revalidatePath('/instantly-leads');
}

export async function deleteLinkedInActivity(id: string) {
  const supabase = await createClient();
  await supabase.from('linkedin_activity').delete().eq('id', id);
  revalidatePath('/linkedin-activity');
}

export async function deleteRep(id: string) {
  const supabase = await createClient();
  await supabase.from('reps').delete().eq('id', id);
  revalidatePath('/sales-team');
}

export async function deleteImportedContact(id: string) {
  const supabase = await createClient();
  await supabase.from('imported_contacts').delete().eq('id', id);
  revalidatePath('/contacts');
}

export async function addDeal(formData: FormData) {
  const supabase = await createClient();
  const customerName = (formData.get('customer_name') as string)?.trim();
  if (!customerName) return;

  await supabase.from('deals').insert({
    customer_name: customerName,
    company: (formData.get('company') as string) || null,
    pic: (formData.get('pic') as string) || null,
    product: (formData.get('product') as string) || null,
    value: Number(formData.get('value')) || 0,
    start_date: (formData.get('start_date') as string) || new Date().toISOString().slice(0, 10),
    expected_close_date: (formData.get('expected_close_date') as string) || null,
    notes: (formData.get('notes') as string) || null
  });
  revalidatePath('/deals');
}

export async function updateDeal(
  id: string,
  fields: Partial<{
    assigned_rep_id: string | null;
    status: DealPipelineStatus;
    value: number;
    expected_close_date: string | null;
    notes: string;
    account_id: string | null;
  }>
) {
  const supabase = await createClient();
  const { data: updated } = await supabase
    .from('deals')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('customer_name, company')
    .maybeSingle();
  if (fields.assigned_rep_id) {
    await notifyAssignment(
      supabase,
      fields.assigned_rep_id,
      'deal',
      updated?.customer_name || updated?.company || 'a deal',
      '/deals',
      id
    );
  }
  revalidatePath('/deals');
}

export async function deleteDeal(id: string) {
  const supabase = await createClient();
  await supabase.from('deals').delete().eq('id', id);
  revalidatePath('/deals');
}

export async function addAccount(formData: FormData) {
  const supabase = await createClient();
  const name = (formData.get('name') as string)?.trim();
  if (!name) return;

  await supabase.from('accounts').insert({
    name,
    hq: (formData.get('hq') as string) || null,
    website: (formData.get('website') as string) || null,
    industry: (formData.get('industry') as string) || null,
    company_size: (formData.get('company_size') as string) || null,
    notes: (formData.get('notes') as string) || null,
    assigned_rep_id: (formData.get('assigned_rep_id') as string) || null
  });
  revalidatePath('/accounts');
}

export async function updateAccount(
  id: string,
  fields: Partial<{
    name: string;
    hq: string | null;
    website: string | null;
    industry: string | null;
    company_size: string | null;
    notes: string | null;
    assigned_rep_id: string | null;
  }>
) {
  const supabase = await createClient();
  const { data: updated } = await supabase
    .from('accounts')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('name')
    .maybeSingle();
  if (fields.assigned_rep_id) {
    await notifyAssignment(supabase, fields.assigned_rep_id, 'account', updated?.name || 'an account', '/accounts', id);
  }
  revalidatePath('/accounts');
  revalidatePath(`/accounts/${id}`);
}

export async function deleteAccount(id: string) {
  const supabase = await createClient();
  await supabase.from('accounts').delete().eq('id', id);
  revalidatePath('/accounts');
}

export async function addAccountContact(accountId: string, formData: FormData) {
  const supabase = await createClient();
  const name = (formData.get('name') as string)?.trim();
  if (!name) return;

  await supabase.from('account_contacts').insert({
    account_id: accountId,
    name,
    job_title: (formData.get('job_title') as string) || null,
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    notes: (formData.get('notes') as string) || null
  });
  revalidatePath(`/accounts/${accountId}`);
  revalidatePath('/contacts');
}

export async function updateAccountContact(
  id: string,
  accountId: string,
  fields: Partial<{ name: string; job_title: string | null; email: string | null; phone: string | null; notes: string | null }>
) {
  const supabase = await createClient();
  await supabase.from('account_contacts').update(fields).eq('id', id);
  revalidatePath(`/accounts/${accountId}`);
  revalidatePath('/contacts');
}

export async function deleteAccountContact(id: string, accountId: string) {
  const supabase = await createClient();
  await supabase.from('account_contacts').delete().eq('id', id);
  revalidatePath(`/accounts/${accountId}`);
  revalidatePath('/contacts');
}

export async function createAccountFromDeal(dealId: string) {
  const supabase = await createClient();
  const { data: deal } = await supabase.from('deals').select('company, customer_name').eq('id', dealId).maybeSingle();
  const name = deal?.company?.trim() || deal?.customer_name?.trim() || 'New Account';

  const { data: account } = await supabase.from('accounts').insert({ name }).select('id').single();
  if (account) {
    await supabase.from('deals').update({ account_id: account.id, updated_at: new Date().toISOString() }).eq('id', dealId);
  }
  revalidatePath('/deals');
  revalidatePath('/accounts');
  return account?.id ?? null;
}

export async function addFeedback(formData: FormData) {
  const supabase = await createClient();
  const title = (formData.get('title') as string)?.trim();
  if (!title) return;

  await supabase.from('feedback').insert({
    title,
    description: (formData.get('description') as string) || null,
    submitted_by_rep_id: (formData.get('submitted_by_rep_id') as string) || null
  });
  revalidatePath('/feedback');
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus) {
  const supabase = await createClient();
  await supabase.from('feedback').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  revalidatePath('/feedback');
}

export async function deleteFeedback(id: string) {
  const supabase = await createClient();
  await supabase.from('feedback').delete().eq('id', id);
  revalidatePath('/feedback');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function getRecentNotifications() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30)
    .returns<Notification[]>();
  return data ?? [];
}

export async function markNotificationsRead() {
  const supabase = await createClient();
  await supabase.from('notifications').update({ read: true }).eq('read', false);
}

export async function deleteNotification(id: string) {
  const supabase = await createClient();
  await supabase.from('notifications').delete().eq('id', id);
}

export async function clearAllNotifications() {
  const supabase = await createClient();
  await supabase.from('notifications').delete().not('id', 'is', null);
}
