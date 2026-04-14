/**
 * Mobile entry point — used exclusively by Capacitor native builds.
 * Does NOT include public website pages (HomePage, landing page).
 * Only includes: auth (login/signup) + the main app dashboard.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Styles: skip public-pages.css since we don't render the landing page
import './styles/index.css';
import './styles/themes.css';
import './styles/responsive.css';
import './styles/responsive-all-formats.css';
import './styles/ui-sleek.css';
import './styles/refinements-ui.css';
import './styles/mobile-app.css';
import './styles/mobile-module.css';

import App from './App';
import { initNativePlatform } from './native/capacitor-init';

// Initialize native platform features (StatusBar, Keyboard, SplashScreen)
initNativePlatform();

// Mark body as native app for CSS isolation (prevents desktop scroll/height rules)
document.body.classList.add('native-app');

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
