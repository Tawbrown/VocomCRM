'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '@/app/actions';

const LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/website-leads', label: 'Website Leads' },
  { href: '/instantly-leads', label: 'Instantly Leads' },
  { href: '/deals', label: 'Deals' },
  { href: '/linkedin-activity', label: 'LinkedIn Activity' },
  { href: '/linkedin-marketing', label: 'LinkedIn Marketing' },
  { href: '/seo', label: 'SEO' },
  { href: '/contacts', label: 'Contacts' },
  { href: '/sales-team', label: 'Sales Team' }
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-neutral-900">Vocom CRM</span>
          <nav className="hidden md:flex md:gap-1">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm ${
                    active ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <button onClick={handleSignOut} className="hidden text-sm text-neutral-500 hover:text-neutral-900 md:block">
          Sign out
        </button>

        <button
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
          className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 md:hidden"
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <nav className="border-t border-neutral-200 px-4 py-2 md:hidden">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm ${
                  active ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            onClick={handleSignOut}
            className="mt-1 block w-full rounded-md px-3 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-100"
          >
            Sign out
          </button>
        </nav>
      )}
    </header>
  );
}
