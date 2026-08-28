'use client';

import { useTransition } from 'react';
import { addAccountContact, deleteAccountContact, updateAccountContact } from '@/app/actions';
import { DeleteButton } from '@/components/delete-button';
import type { AccountContact } from '@/lib/types';

function Cell({
  value,
  onChange,
  width = 'w-full'
}: {
  value: string | null;
  onChange: (value: string) => Promise<void>;
  width?: string;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <input
      type="text"
      defaultValue={value ?? ''}
      disabled={isPending}
      onBlur={(e) => {
        if (e.target.value !== (value ?? '')) startTransition(() => onChange(e.target.value));
      }}
      className={`${width} rounded-md border border-neutral-300 px-2 py-1 text-sm text-neutral-900 disabled:opacity-50`}
    />
  );
}

export function AccountContactsTable({ accountId, contacts }: { accountId: string; contacts: AccountContact[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Job Title</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Phone</th>
            <th className="px-4 py-3 font-medium">Notes</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {contacts.map((contact) => (
            <tr key={contact.id}>
              <td className="px-4 py-3">
                <Cell value={contact.name} onChange={(name) => updateAccountContact(contact.id, accountId, { name })} />
              </td>
              <td className="px-4 py-3">
                <Cell
                  value={contact.job_title}
                  onChange={(job_title) => updateAccountContact(contact.id, accountId, { job_title })}
                />
              </td>
              <td className="px-4 py-3">
                <Cell value={contact.email} onChange={(email) => updateAccountContact(contact.id, accountId, { email })} />
              </td>
              <td className="px-4 py-3">
                <Cell value={contact.phone} onChange={(phone) => updateAccountContact(contact.id, accountId, { phone })} />
              </td>
              <td className="px-4 py-3">
                <Cell value={contact.notes} onChange={(notes) => updateAccountContact(contact.id, accountId, { notes })} />
              </td>
              <td className="px-4 py-3">
                <DeleteButton
                  onDelete={() => deleteAccountContact(contact.id, accountId)}
                  confirmMessage={`Delete ${contact.name || 'this contact'}? This can't be undone.`}
                />
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={6} className="px-4 py-3">
              <form
                action={(formData) => addAccountContact(accountId, formData)}
                className="flex flex-wrap items-center gap-2"
              >
                <input
                  name="name"
                  placeholder="Name"
                  required
                  className="w-32 rounded-md border border-neutral-300 px-2 py-1 text-sm text-neutral-900"
                />
                <input
                  name="job_title"
                  placeholder="Job title"
                  className="w-36 rounded-md border border-neutral-300 px-2 py-1 text-sm text-neutral-900"
                />
                <input
                  name="email"
                  placeholder="Email"
                  className="w-44 rounded-md border border-neutral-300 px-2 py-1 text-sm text-neutral-900"
                />
                <input
                  name="phone"
                  placeholder="Phone"
                  className="w-32 rounded-md border border-neutral-300 px-2 py-1 text-sm text-neutral-900"
                />
                <input
                  name="notes"
                  placeholder="Notes"
                  className="w-40 rounded-md border border-neutral-300 px-2 py-1 text-sm text-neutral-900"
                />
                <button
                  type="submit"
                  className="rounded-md bg-neutral-900 px-3 py-1 text-sm font-medium text-white hover:bg-neutral-700"
                >
                  Add
                </button>
              </form>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
