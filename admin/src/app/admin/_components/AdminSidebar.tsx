'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Admin only. User engagement + management. No system control or Super Admin features. */
const ADMIN_NAV = [
  { href: '/admin/dashboard', label: 'Dashboard / Overview', icon: '📊' },
  { href: '/admin/users', label: 'User Management', icon: '👥' },
  { href: '/admin/leaderboard', label: 'Streak Leaderboard', icon: '🔥' },
  { href: '/admin/engagement', label: 'Engagement Analytics', icon: '📈' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙' },
];

interface AdminSidebarProps {
  onLogout: () => void;
}

export function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-700/50 bg-slate-900/95">
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-slate-700/50 px-4">
          <span className="text-lg font-semibold text-slate-100">Admin</span>
          <span className="rounded bg-blue-600/20 px-2 py-0.5 text-xs font-medium text-blue-400">
            User engagement
          </span>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {ADMIN_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-700/50 p-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
          >
            <span className="text-lg">logout</span>
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}
