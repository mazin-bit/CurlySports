'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Super Admin only. System control tabs — no member or sports UI. */
const SUPER_ADMIN_NAV = [
  { href: '/super-admin/dashboard', label: 'Dashboard / System Overview', icon: '◉' },
  { href: '/super-admin/admins', label: 'Admin Management', icon: '◈' },
  { href: '/super-admin/roles', label: 'Role & Permissions', icon: '◎' },
  { href: '/super-admin/audit', label: 'Audit Logs / System Logs', icon: '≡' },
  { href: '/super-admin/health', label: 'Server & Database Health', icon: '◆' },
  { href: '/super-admin/features', label: 'Feature Flags / Maintenance', icon: '⚙' },
];

interface SuperAdminSidebarProps {
  onLogout: () => void;
}

export function SuperAdminSidebar({ onLogout }: SuperAdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-amber-950/50 bg-[#0a0e1a]">
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-amber-950/50 px-4">
          <span className="text-sm font-semibold tracking-tight text-slate-200">System Control</span>
          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-400">
            Super Admin
          </span>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {SUPER_ADMIN_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-300'
                }`}
              >
                <span className="text-xs opacity-80">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-amber-950/50 p-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-800/60 hover:text-slate-300"
          >
            <span className="text-xs">→</span>
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}
