import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Verifies Framer's actual webhook signature (a real HTTP framework can read headers,
// unlike the old Apps Script version which had to fall back to a URL token).
// Framer signs: HMAC-SHA256(rawBody + submissionId, secret) -> "sha256=<hex>"
function verifySignature(rawBody: string, submissionId: string, secret: string, header: string) {
  const expected =
    'sha256=' +
    crypto
      .createHmac('sha256', secret)
      .update(Buffer.concat([Buffer.from(rawBody, 'utf-8'), Buffer.from(submissionId, 'utf-8')]))
      .digest('hex');

  const expectedBuf = Buffer.from(expected);
  const headerBuf = Buffer.from(header);
  if (expectedBuf.length !== headerBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, headerBuf);
}

export async function POST(request: NextRequest) {
  const secret = process.env.FRAMER_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'webhook not configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  const signatureHeader = request.headers.get('framer-signature');
  const submissionId = request.headers.get('framer-webhook-submission-id');

  if (
    !signatureHeader ||
    !submissionId ||
    !verifySignature(rawBody, submissionId, secret, signatureHeader)
  ) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(rawBody);
  } catch {
    // Framer always sends JSON, but don't crash on a malformed body — store what we can.
  }

  // Framer field labels sometimes carry stray whitespace into the submitted key (seen in
  // production: "Company " with a trailing space), which breaks an exact-match lookup —
  // match on trimmed keys instead so label edits in Framer don't silently stop working.
  const trimmed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    trimmed[key.trim()] = value;
  }

  const field = (keys: string[]) => {
    for (const key of keys) {
      const value = trimmed[key];
      if (typeof value === 'string' && value.trim()) return value;
    }
    return null;
  };

  const name = field(['Name', 'name']);
  const email = field(['Email', 'email']);
  const company = field(['Company', 'company']);

  const supabase = createAdminClient();
  const { error } = await supabase.from('website_leads').insert({
    name,
    email,
    company,
    location: field(['Location', 'location']),
    company_size: field(['Company Size', 'company_size']),
    use_case: field(['Use Case', 'use_case']),
    raw_payload: data
  });

  if (error) {
    console.error('Failed to insert website lead:', error);
    return NextResponse.json({ error: 'insert failed' }, { status: 500 });
  }

  await supabase.from('notifications').insert({
    type: 'website_lead',
    title: `New website lead: ${name || email || 'Unknown'}${company ? ` (${company})` : ''}`,
    link: '/website-leads'
  });

  return NextResponse.json({ ok: true });
}
