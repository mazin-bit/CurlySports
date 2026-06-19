"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { IconDefs } from "./Icons";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";
import MobileMenu from "./MobileMenu";
import MaintenanceGuard from "./MaintenanceGuard";

interface AppShellProps {
  active: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function AppShell({ active, title, subtitle, children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <MaintenanceGuard>
      <IconDefs />
      <div className="app-shell">
        <Sidebar active={active} />
        <div className="app-main">
          <Topbar title={title} subtitle={subtitle} />
          <div key={pathname} className="app-content page-enter">{children}</div>
          <BottomNav active={active} onMenuOpen={() => setMenuOpen(true)} />
        </div>
      </div>
      {menuOpen && <MobileMenu active={active} onClose={() => setMenuOpen(false)} />}
    </MaintenanceGuard>
  );
}
