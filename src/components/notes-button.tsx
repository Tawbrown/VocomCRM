'use client';

import { useState, useTransition } from 'react';

export function NotesButton({
  title,
  subtitle,
  notes,
  onSave
}: {
  title: string;
  subtitle?: string | null;
  notes: string | null;
  onSave: (notes: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(notes ?? '');
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setDraft(notes ?? '');
    setOpen(true);
  }

  function handleSave() {
    startTransition(async () => {
      await onSave(draft);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className={`rounded-md px-2 py-1 text-xs font-medium ${
          notes ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200' : 'text-neutral-400 hover:text-neutral-600'
        }`}
      >
        {notes ? 'View note' : '+ Note'}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
                {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
              </div>
              <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                ✕
              </button>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={8}
              placeholder="Add a note…"
              autoFocus
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
              >
                {isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
