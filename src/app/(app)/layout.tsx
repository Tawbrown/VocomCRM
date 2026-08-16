import { Nav } from '@/components/nav';
import { NotificationBell } from '@/components/notification-bell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-neutral-50 md:flex-row">
      <Nav />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-end border-b border-neutral-200 bg-white px-4 py-2">
          <NotificationBell />
        </div>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
