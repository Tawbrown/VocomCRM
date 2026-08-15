'use client';

import { useTransition } from 'react';

export function DeleteButton({
  onDelete,
  confirmMessage = 'Delete this entry? This can’t be undone.'
}: {
  onDelete: () => Promise<void>;
  confirmMessage?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        startTransition(onDelete);
      }}
      disabled={isPending}
      title="Delete"
      className="rounded-md p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      🗑
    </button>
  );
}
