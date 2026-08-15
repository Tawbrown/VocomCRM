// Minimal RFC4180-ish CSV parser — handles quoted fields and escaped quotes, no external
// dependency needed for something this scoped.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

const FIELD_ALIASES: Record<string, string[]> = {
  email: ['email', 'email address', 'e-mail'],
  phone: ['phone', 'phone number', 'mobile', 'telephone'],
  company: ['company', 'organization', 'company name', 'organisation'],
  job_title: ['title', 'job title', 'position', 'role'],
  linkedin_url: ['linkedin', 'linkedin url', 'linkedin profile', 'profile url'],
  first_name: ['first name', 'firstname'],
  last_name: ['last name', 'lastname'],
  name: ['name', 'full name']
};

function matchColumn(headers: string[], field: string): number {
  const aliases = FIELD_ALIASES[field] ?? [field];
  return headers.findIndex((h) => aliases.includes(h.trim().toLowerCase()));
}

export interface ParsedContact {
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  linkedin_url: string | null;
  raw: Record<string, string>;
}

export function parseContactsCsv(text: string): ParsedContact[] {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const headers = rows[0];

  const emailCol = matchColumn(headers, 'email');
  const phoneCol = matchColumn(headers, 'phone');
  const companyCol = matchColumn(headers, 'company');
  const titleCol = matchColumn(headers, 'job_title');
  const linkedinCol = matchColumn(headers, 'linkedin_url');
  const nameCol = matchColumn(headers, 'name');
  const firstCol = matchColumn(headers, 'first_name');
  const lastCol = matchColumn(headers, 'last_name');

  const cell = (row: string[], i: number) => (i >= 0 ? row[i]?.trim() || null : null);

  return rows.slice(1).map((row) => {
    const raw: Record<string, string> = {};
    headers.forEach((h, i) => (raw[h] = row[i] ?? ''));

    let name = cell(row, nameCol);
    if (!name && (firstCol >= 0 || lastCol >= 0)) {
      name = [cell(row, firstCol), cell(row, lastCol)].filter(Boolean).join(' ') || null;
    }

    return {
      name,
      email: cell(row, emailCol),
      phone: cell(row, phoneCol),
      company: cell(row, companyCol),
      job_title: cell(row, titleCol),
      linkedin_url: cell(row, linkedinCol),
      raw
    };
  });
}
