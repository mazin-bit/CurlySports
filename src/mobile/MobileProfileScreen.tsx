import React from 'react';

const THEMES = [
  { id: 'default', label: 'Default' },
  { id: 'sunshine', label: 'Sunshine' },
  { id: 'sea', label: 'Sea' },
  { id: 'fire', label: 'Fire' },
  { id: 'forest', label: 'Forest' },
  { id: 'ice', label: 'Ice' },
  { id: 'flower', label: 'Flower' },
  { id: 'star', label: 'Star' },
];

interface MobileProfileScreenProps {
  user: any;
  onLogout: () => void;
  colorScheme: string;
  setColorScheme: (scheme: string) => void;
  themeMode: string;
  setThemeMode: (mode: string) => void;
}

export function MobileProfileScreen({
  user,
  onLogout,
  colorScheme,
  setColorScheme,
  themeMode,
  setThemeMode,
}: MobileProfileScreenProps) {
  return (
    <div className="mobile-profile-screen">
      {/* Hero / Avatar */}
      <div className="mobile-profile__hero">
        <div className="mobile-profile__avatar">
          {user?.avatar && user.avatar.length > 2 ? (
            <img src={user.avatar} alt="" />
          ) : (
            user?.avatar || user?.name?.charAt(0) || 'U'
          )}
        </div>
        <div className="mobile-profile__name">{user?.name || 'Member'}</div>
        <div className="mobile-profile__email">{user?.email || ''}</div>
        {user?.role && (
          <span className="mobile-profile__role-badge">
            <span className="material-icons-round" style={{ fontSize: 14 }}>
              {user.role === 'super_admin' ? 'shield' : user.role === 'admin' ? 'admin_panel_settings' : 'person'}
            </span>
            {user.role.replace('_', ' ')}
          </span>
        )}
        {typeof user?.currentStreak === 'number' && user.currentStreak > 0 && (
          <div className="mobile-profile__streak">
            <span className="material-icons-round">local_fire_department</span>
            {user.currentStreak} day streak
          </div>
        )}
      </div>

      {/* Appearance */}
      <div className="mobile-profile__section">
        <div className="mobile-profile__section-title">Appearance</div>
        <div
          className="mobile-profile__option"
          onClick={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
        >
          <span className="material-icons-round">
            {colorScheme === 'dark' ? 'dark_mode' : 'light_mode'}
          </span>
          <span className="mobile-profile__option-text">
            {colorScheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
          <span className="mobile-profile__option-value">
            <span className="material-icons-round" style={{ fontSize: 18 }}>swap_horiz</span>
          </span>
        </div>
      </div>

      {/* Theme */}
      <div className="mobile-profile__section">
        <div className="mobile-profile__section-title">Theme</div>
        <div className="mobile-profile__theme-grid">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`mobile-profile__theme-btn${themeMode === t.id ? ' active' : ''}`}
              data-theme={t.id}
              onClick={() => setThemeMode(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Account */}
      <div className="mobile-profile__section">
        <div className="mobile-profile__section-title">Account</div>
        <button className="mobile-profile__logout" onClick={onLogout}>
          <span className="material-icons-round">logout</span>
          Sign Out
        </button>
      </div>
    </div>
  );
}
