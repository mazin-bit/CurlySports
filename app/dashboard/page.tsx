import AppShell from "@/components/AppShell";
import styles from "./dashboard.module.css";
import DashboardClient from "./DashboardClient";

export const metadata = { title: "Home · Curly Sports" };

export default function DashboardPage() {
  return (
    <AppShell active="home" title="Curly Sports" subtitle="Your sports hub">
      <div className={styles.stack}>
        <DashboardClient />
      </div>
    </AppShell>
  );
}
