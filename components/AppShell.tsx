"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { IconDefs } from "./Icons";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";
import MobileMenu from "./MobileMenu";
import MaintenanceGuard from "./MaintenanceGuard";
import LuckyDrawOverlay from "./LuckyDrawOverlay";
import { useLanguage } from "@/contexts/LanguageContext";

interface AppShellProps {
  active: string;
  title: string;
  titleKey?: string;
  subtitle?: string;
  subtitleKey?: string;
  children: React.ReactNode;
}

export default function AppShell({ active, title, titleKey, subtitle, subtitleKey, children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();

  const resolvedTitle = titleKey ? t(titleKey) : title;
  const resolvedSubtitle = subtitleKey ? t(subtitleKey) : subtitle;

  return (
    <MaintenanceGuard>
      <IconDefs />
      <div className="app-shell">
        <Sidebar active={active} />
        <div className="app-main">
          <Topbar title={resolvedTitle} subtitle={resolvedSubtitle} />
          <div key={pathname} className="app-content page-enter">{children}</div>
          <BottomNav active={active} onMenuOpen={() => setMenuOpen(true)} />
        </div>
      </div>
      {menuOpen && <MobileMenu active={active} onClose={() => setMenuOpen(false)} />}
      <LuckyDrawOverlay />
    </MaintenanceGuard>
  );
}
