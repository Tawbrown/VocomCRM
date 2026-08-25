'use client';

import { useState, useTransition } from 'react';
import { triggerInstantlySync } from '@/app/actions';

export function SyncNowButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      try {
        const res = await triggerInstantlySync();
        setResult(
          `Synced — ${res.inserted} new lead${res.inserted === 1 ? '' : 's'}, ${res.repliesProcessed} new repl${res.repliesProcessed === 1 ? 'y' : 'ies'}.`
        );
      } catch {
        setResult('Sync failed — try again in a moment.');
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md bg-vocom px-3 py-1.5 text-sm font-medium text-white hover:bg-vocom-dark disabled:opacity-50"
      >
        {isPending ? 'Syncing… (can take up to a few minutes)' : 'Sync Now'}
      </button>
      {result && <span className="text-sm text-neutral-500">{result}</span>}
    </div>
  );
}
