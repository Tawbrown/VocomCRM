import Link from 'next/link';
import { deleteImportedContact } from '@/app/actions';
import { DeleteButton } from '@/components/delete-button';
import type { MasterContact } from '@/lib/types';

const SOURCE_COLORS: Record<string, string> = {
  Website: 'bg-blue-100 text-blue-700',
  'Offline Event': 'bg-purple-100 text-purple-700',
  Referral: 'bg-green-100 text-green-700',
  Research: 'bg-amber-100 text-amber-700',
  Other: 'bg-neutral-100 text-neutral-500',
  Instantly: 'bg-purple-100 text-purple-700',
  'LinkedIn Activity': 'bg-sky-100 text-sky-700'
};

export function ContactsTable({
  contacts,
  totalCount,
  page,
  pageSize,
  query,
  sort
}: {
  contacts: MasterContact[];
  totalCount: number;
  page: number;
  pageSize: number;
  query: string;
  sort: string;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (sort && sort !== 'recent') params.set('sort', sort);
    params.set('page', String(p));
    return `?${params.toString()}`;
  };

  return (
    <div>
      <form method="GET" className="mb-4 flex flex-wrap gap-2">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search by name, email, company, phone..."
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 sm:w-80"
        />
        <select
          name="sort"
          defaultValue={sort}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
        >
          <option value="recent">Most Recent</option>
          <option value="name">Name (A-Z)</option>
          <option value="company">Company (A-Z)</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Search
        </button>
        {(query || sort !== 'recent') && (
          <Link
            href="?page=1"
            className="rounded-md px-4 py-2 text-sm text-neutral-500 ring-1 ring-inset ring-neutral-200 hover:bg-neutral-100"
          >
            Clear
          </Link>
        )}
      </form>

      {contacts.length === 0 ? (
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
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {contacts.map((c) => (
                <tr key={c.id}>
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
                  <td className="px-4 py-3">
                    {c.origin === 'imported_contacts' ? (
                      <DeleteButton onDelete={() => deleteImportedContact(c.id)} />
                    ) : (
                      <span
                        className="text-xs text-neutral-300"
                        title="Delete this from its own page (Leads / Instantly Leads / LinkedIn Activity / an account's Contacts) — Contacts is a combined view"
                      >
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 text-sm text-neutral-500">
            <span>
              {totalCount === 0
                ? '0 results'
                : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalCount)} of ${totalCount.toLocaleString()}`}
            </span>
            <div className="flex gap-2">
              <Link
                href={pageHref(Math.max(1, page - 1))}
                aria-disabled={page <= 1}
                className={`rounded-md px-3 py-1 ring-1 ring-inset ring-neutral-200 ${
                  page <= 1 ? 'pointer-events-none text-neutral-300' : 'hover:bg-neutral-100'
                }`}
              >
                Previous
              </Link>
              <Link
                href={pageHref(Math.min(totalPages, page + 1))}
                aria-disabled={page >= totalPages}
                className={`rounded-md px-3 py-1 ring-1 ring-inset ring-neutral-200 ${
                  page >= totalPages ? 'pointer-events-none text-neutral-300' : 'hover:bg-neutral-100'
                }`}
              >
                Next
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
