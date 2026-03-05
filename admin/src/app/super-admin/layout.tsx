'use client';

import { useRouter } from 'next/navigation';
import { SuperAdminSidebar } from './_components/SuperAdminSidebar';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <SuperAdminSidebar onLogout={handleLogout} />
      <main className="min-h-screen pl-60">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
