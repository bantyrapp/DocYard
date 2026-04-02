import React, { useState, useCallback, useEffect } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { HamburgerMenu } from './HamburgerMenu';
import { Verification } from '../pages/Verification';
import { Onboarding } from '../pages/Onboarding';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setThemeState] = useState(() => localStorage.getItem('docyard-theme') || 'dark');
  const { signedIn, onboardingComplete, user, signInDev, signOut, onVerify, completeOnboarding } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const setTheme = useCallback((value) => {
    setThemeState(value);
    localStorage.setItem('docyard-theme', value);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Redirect: onboarding requires signed-in; if already completed, go home
  useEffect(() => {
    if (location.pathname === '/onboarding') {
      if (!signedIn) navigate('/', { replace: true });
      else if (onboardingComplete) navigate('/', { replace: true });
    }
  }, [location.pathname, signedIn, onboardingComplete, navigate]);

  const showVerification = location.pathname === '/signup';
  const showOnboarding = location.pathname === '/onboarding' && signedIn && !onboardingComplete;

  const mainContent = showVerification ? (
    <Verification onVerify={onVerify} />
  ) : showOnboarding ? (
    <Onboarding user={user} onComplete={completeOnboarding} />
  ) : (
    <Outlet />
  );

  return (
    <div className="layout">
      <header className="app-bar">
        <div className="app-bar-inner">
          <Link to="/" className="app-bar-brand">
            <img src="/icon.png" alt="" className="app-bar-icon" width="36" height="36" />
            <span className="app-bar-logo">EazyBookz</span>
            <span className="app-bar-tagline">Trial balance to Yardi, easy</span>
          </Link>
          <nav className="app-bar-nav" aria-label="Main">
            <Link to="/" className="app-bar-link">Home</Link>
            <Link to="/documents" className="app-bar-link">Documents</Link>
            <Link to="/download" className="app-bar-link">Download</Link>
            <Link to="/pricing" className="app-bar-link">Pricing</Link>
            <Link to="/about" className="app-bar-link">About</Link>
            <Link to="/terms" className="app-bar-link">Terms</Link>
            <Link to="/privacy" className="app-bar-link">Privacy</Link>
          </nav>
          <div className="app-bar-actions">
            <div className="app-bar-theme" title="Theme">
              <button
                type="button"
                className={`app-bar-theme-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
                aria-label="Light theme"
              >
                Light
              </button>
              <button
                type="button"
                className={`app-bar-theme-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
                aria-label="Dark theme"
              >
                Dark
              </button>
            </div>
            {signedIn ? (
              <button type="button" className="app-bar-btn" onClick={signOut}>Sign out</button>
            ) : (
              <>
                <button type="button" className="app-bar-btn" onClick={signInDev}>Sign in</button>
                <Link to="/signup" className="app-bar-btn app-bar-btn--primary">Create account</Link>
              </>
            )}
          </div>
          <button
            type="button"
            className="app-bar-menu-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <span className="hamburger-icon" aria-hidden />
            <span className="hamburger-icon" aria-hidden />
            <span className="hamburger-icon" aria-hidden />
          </button>
        </div>
      </header>

      <HamburgerMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
        signedIn={signedIn}
        onSignIn={signInDev}
        onSignOut={signOut}
      />

      <main className="layout-main">
        {mainContent}
      </main>

      <footer className="app-footer">
        <div className="app-footer-inner">
          <div className="footer-privacy-strip" role="status">
            <span className="footer-privacy-dot" aria-hidden />
            <span>Local processing — your file never leaves your device</span>
          </div>

          <div className="footer-cols">
            <div className="footer-col">
              <span className="footer-col-label">Product</span>
              <Link to="/">Home</Link>
              <Link to="/documents">Documents</Link>
              <Link to="/download">Download</Link>
              <Link to="/pricing">Pricing</Link>
              <Link to="/about">About</Link>
            </div>
            <div className="footer-col">
              <span className="footer-col-label">Legal</span>
              <Link to="/terms">Terms</Link>
              <Link to="/privacy">Privacy</Link>
            </div>
          </div>

          <div className="footer-bottom">
            <span className="footer-logo">EazyBookz</span>
            <span className="footer-year">© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
