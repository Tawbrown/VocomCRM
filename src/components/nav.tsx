'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '@/app/actions';

const LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/website-leads', label: 'Website Leads' },
  { href: '/instantly-leads', label: 'Instantly Leads' },
  { href: '/linkedin-activity', label: 'LinkedIn Activity' },
  { href: '/linkedin-marketing', label: 'LinkedIn Marketing' },
  { href: '/sales-team', label: 'Sales Team' }
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-neutral-900">Vocom CRM</span>
          <nav className="flex gap-1">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm ${
                    active
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <button
          onClick={async () => {
            await signOut();
            router.push('/login');
            router.refresh();
          }}
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
