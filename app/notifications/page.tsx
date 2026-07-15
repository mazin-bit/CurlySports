"use client";

import AppShell from "@/components/AppShell";
import styles from "./notifications.module.css";
import { useState, useEffect } from "react";
import { Bell, BellRing, Check, Trash2, Loader, Megaphone } from "lucide-react";
import { Ico } from "@/components/Icons";
import { useLanguage } from "@/contexts/LanguageContext";

interface Notif {
  id: string;
  group: "today" | "earlier";
  icon: string;
  color: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  type?: "admin" | "activity";
}

const ICON_MAP: Record<string, string> = {
  heart: "i-heart",
  spark: "i-spark",
  live: "i-live",
  news: "i-news",
  flame: "i-spark",
  megaphone: "i-spark",
};

export default function NotificationsPage() {
  const { t } = useLanguage();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/mobile/notifications")
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then((data: Notif[]) => {
        setNotifs(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const todayNotifs = notifs.filter((n) => n.group === "today");
  const earlierNotifs = notifs.filter((n) => n.group === "earlier");
  const unreadCount = notifs.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const dismissNotif = (id: string) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => setNotifs([]);

  return (
    <AppShell active="notifications" title={t("nav.notifications")} subtitle="">
      <div className="stack">
        {/* Header actions */}
        <div className={styles.headerBar}>
          <div className={styles.headerLeft}>
            <BellRing size={18} className="title-icon" />
            <span className={styles.headerTitle}>{t("nav.notifications")}</span>
            {unreadCount > 0 && (
              <span className={styles.unreadBadge}>{unreadCount}</span>
            )}
          </div>
          <div className={styles.headerActions}>
            {unreadCount > 0 && (
              <button className={styles.actionBtn} onClick={markAllRead}>
                <Check size={13} /> Mark all read
              </button>
            )}
            {notifs.length > 0 && (
              <button className={styles.actionBtnDanger} onClick={clearAll}>
                <Trash2 size={13} /> Clear all
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className={styles.emptyState}>
            <Loader size={22} strokeWidth={1.5} style={{ opacity: 0.4, animation: "spin 1s linear infinite" }} />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className={styles.emptyState}>
            <Bell size={32} strokeWidth={1.5} />
            <p>Could not load notifications</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && notifs.length === 0 && (
          <div className={styles.emptyState}>
            <Bell size={36} strokeWidth={1.5} />
            <p>No notifications yet</p>
            <span className={styles.emptyHint}>
              Activity from debates, scores, and news will appear here
            </span>
          </div>
        )}

        {/* Today */}
        {todayNotifs.length > 0 && (
          <section className="section">
            <div className="sec-head">
              <div className="title">
                <Bell size={15} className="title-icon" /> Today{" "}
                <span className="accent">
                  {todayNotifs.filter((n) => n.unread).length > 0
                    ? `${todayNotifs.filter((n) => n.unread).length} new`
                    : ""}
                </span>
              </div>
            </div>
            <div className={styles.notifList}>
              {todayNotifs.map((n) => (
                <div
                  key={n.id}
                  className={`${styles.notifCard} ${n.unread ? styles.notifUnread : ""}`}
                  onClick={() =>
                    setNotifs((prev) =>
                      prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x))
                    )
                  }
                >
                  <div
                    className={styles.notifIcon}
                    style={{ background: n.color + "18", color: n.color }}
                  >
                    {n.type === "admin" ? <Megaphone size={16} /> : <Ico id={ICON_MAP[n.icon] ?? "i-bell"} />}
                  </div>
                  <div className={styles.notifContent}>
                    <div className={styles.notifTitle}>{n.title}</div>
                    <div className={styles.notifBody}>{n.body}</div>
                  </div>
                  <div className={styles.notifMeta}>
                    <span className={styles.notifTime}>{n.time}</span>
                    {n.unread && <span className={styles.notifDot} />}
                  </div>
                  <button
                    className={styles.dismissBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissNotif(n.id);
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Earlier */}
        {earlierNotifs.length > 0 && (
          <section className="section">
            <div className="sec-head">
              <div className="title">
                <Bell size={15} className="title-icon" /> Earlier
              </div>
            </div>
            <div className={styles.notifList}>
              {earlierNotifs.map((n) => (
                <div
                  key={n.id}
                  className={`${styles.notifCard} ${n.unread ? styles.notifUnread : ""}`}
                  onClick={() =>
                    setNotifs((prev) =>
                      prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x))
                    )
                  }
                >
                  <div
                    className={styles.notifIcon}
                    style={{ background: n.color + "18", color: n.color }}
                  >
                    {n.type === "admin" ? <Megaphone size={16} /> : <Ico id={ICON_MAP[n.icon] ?? "i-bell"} />}
                  </div>
                  <div className={styles.notifContent}>
                    <div className={styles.notifTitle}>{n.title}</div>
                    <div className={styles.notifBody}>{n.body}</div>
                  </div>
                  <div className={styles.notifMeta}>
                    <span className={styles.notifTime}>{n.time}</span>
                    {n.unread && <span className={styles.notifDot} />}
                  </div>
                  <button
                    className={styles.dismissBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissNotif(n.id);
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
