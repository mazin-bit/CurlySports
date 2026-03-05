'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MEMBER_NAV = [
  { href: '/app/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/app/live-scores', label: 'Live scores', icon: '⚽' },
  { href: '/app/teams', label: 'Teams', icon: '👥' },
  { href: '/app/players', label: 'Top players', icon: '⭐' },
  { href: '/app/streaks', label: 'My streaks', icon: '🔥' },
  { href: '/app/favorites', label: 'Favorites', icon: '❤️' },
];

interface MemberSidebarProps {
  onLogout: () => void;
}

export function MemberSidebar({ onLogout }: MemberSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-emerald-900/40 bg-slate-900/95">
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-emerald-900/40 px-4">
          <span className="text-lg font-semibold text-slate-100">Sports</span>
          <span className="rounded bg-emerald-600/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
            Member
          </span>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {MEMBER_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-emerald-600/20 text-emerald-400'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-emerald-900/40 p-3">
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
