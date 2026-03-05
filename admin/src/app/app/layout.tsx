'use client';

import { useRouter } from 'next/navigation';
import { MemberSidebar } from './_components/MemberSidebar';

export default function AppLayout({
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
      <MemberSidebar onLogout={handleLogout} />
      <main className="pl-60 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
