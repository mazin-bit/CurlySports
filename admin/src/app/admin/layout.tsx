'use client';

import { useRouter } from 'next/navigation';
import { AdminSidebar } from './_components/AdminSidebar';

export default function AdminLayout({
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
      <AdminSidebar onLogout={handleLogout} />
      <main className="pl-64 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
