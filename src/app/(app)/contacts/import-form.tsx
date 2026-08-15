'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ImportForm() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const formData = new FormData(e.currentTarget);
    const res = await fetch('/api/contacts/import', { method: 'POST', body: formData });
    const data = await res.json();

    if (!res.ok) {
      setStatus(`Error: ${data.error}`);
    } else {
      setStatus(`Imported ${data.imported} contact(s).`);
      router.refresh();
    }
    setSubmitting(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
    >
      <div className="w-full sm:w-auto">
        <label className="mb-1 block text-xs font-medium text-neutral-500">Source</label>
        <input
          name="source"
          placeholder="e.g. Hunter, LinkedIn export"
          required
          className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm sm:w-48"
        />
      </div>
      <div className="w-full sm:w-auto">
        <label className="mb-1 block text-xs font-medium text-neutral-500">CSV file</label>
        <input
          type="file"
          name="file"
          accept=".csv"
          required
          className="w-full text-sm file:mr-2 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 sm:w-auto"
      >
        {submitting ? 'Importing...' : 'Import'}
      </button>
      {status && <p className="w-full text-sm text-neutral-600">{status}</p>}
    </form>
  );
}
