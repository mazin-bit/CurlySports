// @ts-nocheck
import React, { useState } from 'react';

const ProfileMenu = ({ user, onClose, onLogout, colorScheme, setColorScheme, themeMode, setThemeMode }) => {
  const [personalizeOpen, setPersonalizeOpen] = useState(true);
  return (
    <div className="profile-menu-overlay" onClick={onClose} role="dialog" aria-label="Profile menu">
      <div className="profile-menu-panel" onClick={e => e.stopPropagation()}>
        <div className="profile-menu-header">
          <h3 className="profile-menu-title">Profile</h3>
          <button type="button" className="profile-menu-close" onClick={onClose} aria-label="Close">
            <span className="material-icons-round">close</span>
          </button>
        </div>
        <div className="profile-menu-user">
          <div className="avatar">
            {user?.avatar && user.avatar.length > 2 ? (
              <img loading="lazy" decoding="async" src={user.avatar} alt="" className="avatar-img" />
            ) : (
              user?.avatar || 'M'
            )}
          </div>
          <div className="profile-menu-user-info">
            <span className="name">{user?.name || 'Member'}</span>
            <span className="status">Online</span>
            {user?.role && (
              <span className="user-role-badge">{user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Member'}</span>
            )}
            {typeof user?.currentStreak === 'number' && user.currentStreak > 0 && (
              <span className="profile-menu-streak" title="Login streak">
                <span className="material-icons-round streak-icon">local_fire_department</span>
                {user.currentStreak} day{user.currentStreak !== 1 ? 's' : ''} streak
                {typeof user?.longestStreak === 'number' && user.longestStreak > 0 && user.longestStreak !== user.currentStreak && (
                  <span className="profile-menu-streak-longest"> · Best: {user.longestStreak}d</span>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="profile-menu-section">
          <button type="button" className="profile-menu-section-head" onClick={() => setPersonalizeOpen(!personalizeOpen)} aria-expanded={personalizeOpen}>
            <span className="material-icons-round">palette</span>
            Personalize
            <span className="material-icons-round profile-menu-chevron">{personalizeOpen ? 'expand_less' : 'expand_more'}</span>
          </button>
          {personalizeOpen && (
            <div className="profile-menu-personalize">
              <div className="personalize-row">
                <span className="personalize-label">Appearance</span>
                <div className="personalize-toggle-wrap">
                  <button type="button" className={`personalize-toggle-option ${colorScheme === 'light' ? 'active' : ''}`} onClick={() => setColorScheme('light')}>
                    <span className="material-icons-round">light_mode</span>
                    Light
                  </button>
                  <button type="button" className={`personalize-toggle-option ${colorScheme === 'dark' ? 'active' : ''}`} onClick={() => setColorScheme('dark')}>
                    <span className="material-icons-round">dark_mode</span>
                    Dark
                  </button>
                </div>
              </div>
              <div className="personalize-row">
                <span className="personalize-label">Interface theme</span>
                <div className="theme-mode-grid">
                  <button type="button" className={`theme-mode-card ${themeMode === 'default' ? 'active' : ''}`} onClick={() => setThemeMode('default')}>
                    <span className="material-icons-round theme-mode-icon">palette</span>
                    <span className="theme-mode-name">Default</span>
                    <span className="theme-mode-desc">Neutral dark & light</span>
                  </button>
                  <button type="button" className={`theme-mode-card ${themeMode === 'sunshine' ? 'active' : ''}`} onClick={() => setThemeMode('sunshine')}>
                    <span className="material-icons-round theme-mode-icon">wb_sunny</span>
                    <span className="theme-mode-name">Sunshine</span>
                    <span className="theme-mode-desc">Warm & bright</span>
                  </button>
                  <button type="button" className={`theme-mode-card ${themeMode === 'sea' ? 'active' : ''}`} onClick={() => setThemeMode('sea')}>
                    <span className="material-icons-round theme-mode-icon">waves</span>
                    <span className="theme-mode-name">Sea</span>
                    <span className="theme-mode-desc">Ocean teal & cyan</span>
                  </button>
                  <button type="button" className={`theme-mode-card ${themeMode === 'fire' ? 'active' : ''}`} onClick={() => setThemeMode('fire')}>
                    <span className="material-icons-round theme-mode-icon">local_fire_department</span>
                    <span className="theme-mode-name">Fire</span>
                    <span className="theme-mode-desc">Bold red & orange</span>
                  </button>
                  <button type="button" className={`theme-mode-card ${themeMode === 'forest' ? 'active' : ''}`} onClick={() => setThemeMode('forest')}>
                    <span className="material-icons-round theme-mode-icon">park</span>
                    <span className="theme-mode-name">Forest</span>
                    <span className="theme-mode-desc">Deep green & nature</span>
                  </button>
                  <button type="button" className={`theme-mode-card ${themeMode === 'ice' ? 'active' : ''}`} onClick={() => setThemeMode('ice')}>
                    <span className="material-icons-round theme-mode-icon">ac_unit</span>
                    <span className="theme-mode-name">Ice</span>
                    <span className="theme-mode-desc">Cool blue & frost</span>
                  </button>
                  <button type="button" className={`theme-mode-card ${themeMode === 'flower' ? 'active' : ''}`} onClick={() => setThemeMode('flower')}>
                    <span className="material-icons-round theme-mode-icon">local_florist</span>
                    <span className="theme-mode-name">Flower</span>
                    <span className="theme-mode-desc">Pink & lavender</span>
                  </button>
                  <button type="button" className={`theme-mode-card ${themeMode === 'star' ? 'active' : ''}`} onClick={() => setThemeMode('star')}>
                    <span className="material-icons-round theme-mode-icon">star</span>
                    <span className="theme-mode-name">Star</span>
                    <span className="theme-mode-desc">Purple & gold</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="profile-menu-footer">
          <button type="button" className="profile-menu-logout" onClick={() => { onClose(); onLogout(); }}>
            <span className="material-icons-round">logout</span>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export { ProfileMenu };
export default ProfileMenu;
