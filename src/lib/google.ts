import { google } from 'googleapis';

// GOOGLE_SERVICE_ACCOUNT_KEY is the service account's JSON key, base64-encoded (avoids
// newline/quote escaping problems that raw JSON hits in env vars).
function getCredentials() {
  const encoded = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!encoded) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not set');
  return JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));
}

export function getGoogleAuth(scopes: string[]) {
  return new google.auth.GoogleAuth({ credentials: getCredentials(), scopes });
}

export async function getSearchConsoleClient() {
  const auth = getGoogleAuth(['https://www.googleapis.com/auth/webmasters.readonly']);
  return google.searchconsole({ version: 'v1', auth });
}

export async function getAnalyticsDataClient() {
  const auth = getGoogleAuth(['https://www.googleapis.com/auth/analytics.readonly']);
  return google.analyticsdata({ version: 'v1beta', auth });
}
