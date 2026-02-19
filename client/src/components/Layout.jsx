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
          <div className="footer-line" />
          <p className="footer-trust">
            <span className="footer-trust-icon" aria-hidden>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </span>
            Processed in your browser · your file never leaves your device.
          </p>
          <p className="footer-coming-next">
            <strong>Coming next:</strong> GL name matching — drop their trial balance, match to your chart of accounts, get Yardi import with your account numbers.
          </p>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <span className="footer-dot" aria-hidden>·</span>
            <Link to="/terms">Terms</Link>
            <span className="footer-dot" aria-hidden>·</span>
            <Link to="/privacy">Privacy</Link>
            <span className="footer-dot" aria-hidden>·</span>
            <Link to="/pricing">Pricing</Link>
            <span className="footer-dot" aria-hidden>·</span>
            <Link to="/documents">Documents</Link>
            <span className="footer-dot" aria-hidden>·</span>
            <Link to="/download">Download</Link>
          </div>
          <div className="footer-bottom">
            <span className="footer-logo">EazyBookz</span>
            <span className="footer-copy"> · Trial balance & balance sheet → Yardi journal entries</span>
            <span className="footer-year"> · © {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
