// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';

const BRAND_NAME = 'Curly Sports';

const PublicHeader = ({ isAuthenticated = false, homeTheme = 'light', setHomeTheme, minimal = false }) => (
  <header className={`public-header public-header--curly${minimal ? ' public-header--minimal' : ''}`}>
    <div className="public-header-inner public-header-inner--ref">
      <Link to="/" className="public-logo-link public-logo-link--ref" aria-label="Curly Sports home">
        {minimal ? (
          <img src={`/curlysports-logo.png`} alt="" className="public-logo-img public-logo-img--minimal" />
        ) : (
          <img src="/curlysports-logo.png" alt="Curly Sports" className="public-logo-img" />
        )}
      </Link>
      {minimal ? (
        <>
          <Link to="/" className="public-header-home-link" aria-label="Home">Home</Link>
          {setHomeTheme && (
          <button
            type="button"
            className="public-theme-toggle-single"
            onClick={() => setHomeTheme(homeTheme === 'light' ? 'dark' : 'light')}
            aria-pressed={homeTheme === 'dark'}
            aria-label={homeTheme === 'light' ? 'Switch to night mode' : 'Switch to light mode'}
            title={homeTheme === 'light' ? 'Night mode' : 'Light mode'}
          >
            <span className="material-icons-round" aria-hidden="true">
              {homeTheme === 'light' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        )}
        </>
      ) : (
        <>
          <nav className="public-nav public-nav--ref">
            <Link to="/" className="public-nav-link">Home</Link>
            <a href="#features" className="public-nav-link">Marketplace</a>
          </nav>
          <div className="public-header-right">
            {setHomeTheme && (
              <button
                type="button"
                className="public-theme-toggle-single"
                onClick={() => setHomeTheme(homeTheme === 'light' ? 'dark' : 'light')}
                aria-pressed={homeTheme === 'dark'}
                aria-label={homeTheme === 'light' ? 'Switch to night mode' : 'Switch to light mode'}
                title={homeTheme === 'light' ? 'Night mode' : 'Light mode'}
              >
                <span className="material-icons-round" aria-hidden="true">
                  {homeTheme === 'light' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
            )}
            <span className="public-nav-icon material-icons-round" aria-hidden="true">search</span>
            {isAuthenticated ? (
              <Link to="/dashboard" className="public-nav-cta public-nav-cta--signin">Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="public-nav-cta public-nav-cta--signin">Login</Link>
                <span className="public-nav-icon material-icons-round" aria-hidden="true">menu</span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  </header>
);

export { PublicHeader };
export default PublicHeader;
