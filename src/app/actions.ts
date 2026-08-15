'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { DealPipelineStatus, DealStatus, LeadStatus, LinkedInActivityType } from '@/lib/types';

export async function updateWebsiteLead(
  id: string,
  fields: Partial<{ assigned_rep_id: string | null; status: LeadStatus; notes: string; contacted_date: string | null }>
) {
  const supabase = await createClient();
  await supabase.from('website_leads').update(fields).eq('id', id);
  revalidatePath('/website-leads');
}

export async function updateInstantlyLead(
  id: string,
  fields: Partial<{ assigned_rep_id: string | null; sales_status: LeadStatus; notes: string }>
) {
  const supabase = await createClient();
  await supabase.from('instantly_leads').update(fields).eq('id', id);
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
  await supabase.from('linkedin_activity').update(fields).eq('id', id);
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

export async function deleteWebsiteLead(id: string) {
  const supabase = await createClient();
  await supabase.from('website_leads').delete().eq('id', id);
  revalidatePath('/website-leads');
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
  }>
) {
  const supabase = await createClient();
  await supabase
    .from('deals')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id);
  revalidatePath('/deals');
}

export async function deleteDeal(id: string) {
  const supabase = await createClient();
  await supabase.from('deals').delete().eq('id', id);
  revalidatePath('/deals');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
