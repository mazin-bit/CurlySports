import AppShell from "@/components/AppShell";
import NewsClient from "./NewsClient";

export const metadata = { title: "News · Curly Sports" };

export default function NewsPage() {
  return (
    <AppShell active="news" title="News" subtitle="Sports · Real-time from ESPN & more">
      <div className="stack">
        <NewsClient />
      </div>
    </AppShell>
  );
}
