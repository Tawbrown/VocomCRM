'use client';

import { useMemo, useState } from 'react';
import type { MasterContact } from '@/lib/types';

const SOURCE_COLORS: Record<string, string> = {
  'Website Lead': 'bg-blue-100 text-blue-700',
  Instantly: 'bg-purple-100 text-purple-700',
  'LinkedIn Activity': 'bg-sky-100 text-sky-700'
};

export function ContactsTable({ contacts }: { contacts: MasterContact[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      [c.name, c.email, c.company, c.phone, c.job_title, c.source].some((field) =>
        field?.toLowerCase().includes(q)
      )
    );
  }, [contacts, query]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, email, company, phone..."
        className="mb-4 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm sm:w-80"
      />
      <p className="mb-2 text-xs text-neutral-400">
        {filtered.length} of {contacts.length} contacts
      </p>

      {filtered.length === 0 ? (
        <p className="text-sm text-neutral-500">No contacts match.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.slice(0, 500).map((c, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 text-neutral-900">
                    {c.linkedin_url ? (
                      <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="hover:underline">
                        {c.name || '—'}
                      </a>
                    ) : (
                      c.name || '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-neutral-600">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-neutral-600">{c.company || '—'}</td>
                  <td className="px-4 py-3 text-neutral-600">{c.job_title || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-medium ${
                        SOURCE_COLORS[c.source] ?? 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {c.source}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 500 && (
            <p className="border-t border-neutral-100 px-4 py-2 text-xs text-neutral-400">
              Showing first 500 of {filtered.length} — narrow your search to see more.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
