import { Nav } from '@/components/nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-neutral-50 md:flex-row">
      <Nav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
