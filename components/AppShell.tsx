import { IconDefs } from "./Icons";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";
import MaintenanceGuard from "./MaintenanceGuard";

interface AppShellProps {
  active: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function AppShell({ active, title, subtitle, children }: AppShellProps) {
  return (
    <MaintenanceGuard>
      <IconDefs />
      <div className="app-shell">
        <Sidebar active={active} />
        <div className="app-main">
          <Topbar title={title} subtitle={subtitle} />
          <div className="app-content">{children}</div>
          <BottomNav active={active} />
        </div>
      </div>
    </MaintenanceGuard>
  );
}
