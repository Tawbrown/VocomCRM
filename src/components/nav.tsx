'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '@/app/actions';

const NAV_GROUPS = [
  {
    label: null,
    links: [{ href: '/', label: 'Dashboard' }]
  },
  {
    label: 'Sales',
    links: [
      { href: '/accounts', label: 'Accounts' },
      { href: '/leads', label: 'Leads' },
      { href: '/deals', label: 'Deals' },
      { href: '/sales-dashboard', label: 'Sales Dashboard' }
    ]
  },
  {
    label: 'Marketing',
    links: [
      { href: '/instantly-leads', label: 'Instantly Leads' },
      { href: '/linkedin-activity', label: 'LinkedIn Activity' },
      { href: '/linkedin-marketing', label: 'LinkedIn Marketing' },
      { href: '/seo', label: 'SEO' }
    ]
  },
  {
    label: 'General',
    links: [
      { href: '/contacts', label: 'Contacts' },
      { href: '/sales-team', label: 'Sales Team' },
      { href: '/feedback', label: 'Feedback' }
    ]
  }
];

function VocomMark() {
  return (
    <span className="flex flex-col items-center gap-[3px]">
      {[10, 14, 18].map((w, i) => (
        <span key={i} className="block h-[3px] rounded-full bg-vocom" style={{ width: w }} />
      ))}
    </span>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {NAV_GROUPS.map((group, i) => (
        <div key={group.label ?? i} className={i > 0 ? 'mt-4' : undefined}>
          {group.label && (
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              {group.label}
            </p>
          )}
          <div className="space-y-0.5">
            {group.links.map((link) => {
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavigate}
                  className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                    active ? 'bg-vocom text-white' : 'text-neutral-600 hover:bg-vocom/8 hover:text-vocom'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

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
    <>
      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <VocomMark />
          <span className="text-sm font-bold tracking-wide text-vocom">VOCOM CRM</span>
        </div>
        <button
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
          className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100"
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
      </header>

      {menuOpen && (
        <nav className="border-b border-neutral-200 bg-white px-3 py-2 md:hidden">
          <NavLinks pathname={pathname} onNavigate={() => setMenuOpen(false)} />
          <button
            onClick={handleSignOut}
            className="mt-1 block w-full rounded-md px-3 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-100"
          >
            Sign out
          </button>
        </nav>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-56 md:shrink-0 md:flex-col md:border-r md:border-neutral-200 md:bg-white">
        <div className="flex items-center gap-2 px-5 py-6">
          <VocomMark />
          <span className="text-base font-bold tracking-wide text-vocom">VOCOM CRM</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3">
          <NavLinks pathname={pathname} />
        </nav>
        <div className="border-t border-neutral-200 px-3 py-4">
          <button
            onClick={handleSignOut}
            className="block w-full rounded-md px-3 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-100"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
