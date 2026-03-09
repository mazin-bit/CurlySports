import React from 'react';
import { addNotification, subscribeNotifications, markNotificationRead, markAllNotificationsRead } from '../services/database';
import '../styles/NotificationsBell.css';

export { addNotification };

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body?: string;
  read: boolean;
  [key: string]: unknown;
}

interface NotificationsBellProps {
  userId: string | null;
  onShowToast?: (message: string) => void;
}

function NotificationsBell({ userId, onShowToast }: NotificationsBellProps) {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }
    const unsub = subscribeNotifications(userId, (list) => {
      setNotifications((list || []) as NotificationItem[]);
    });
    return unsub;
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    await markAllNotificationsRead(userId);
  };

  const getTypeIcon = (type: string): string => {
    const map: Record<string, string> = {
      match_start: 'schedule',
      match_result: 'emoji_events',
      goal: 'sports_soccer',
      player_news: 'person',
      transfer: 'swap_horiz',
      info: 'notifications',
    };
    return map[type] || 'notifications';
  };

  return (
    <div className="notifications-bell-wrap">
      <button
        type="button"
        className="notifications-bell-trigger"
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
      >
        <span className="material-icons-round">notifications</span>
        {unreadCount > 0 && (
          <span className="notifications-bell-badge" aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="notifications-bell-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="notifications-bell-dropdown" role="menu">
            <div className="notifications-bell-header">
              <h4 className="notifications-bell-title">Notifications</h4>
              {unreadCount > 0 && (
                <button type="button" className="notifications-bell-mark-all" onClick={handleMarkAllRead}>
                  Mark all read
                </button>
              )}
            </div>
            <div className="notifications-bell-list">
              {notifications.length === 0 ? (
                <p className="notifications-bell-empty">No notifications yet.</p>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className={`notifications-bell-item ${n.read ? 'read' : ''}`}
                    onClick={() => {
                      handleMarkRead(n.id);
                      setOpen(false);
                    }}
                    role="menuitem"
                  >
                    <span className="material-icons-round notifications-bell-item-icon">
                      {getTypeIcon(n.type)}
                    </span>
                    <div className="notifications-bell-item-body">
                      <span className="notifications-bell-item-title">{n.title}</span>
                      {n.body ? <span className="notifications-bell-item-body-text">{n.body}</span> : null}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationsBell;
