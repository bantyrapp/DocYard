import React, { useState, useCallback, useEffect } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { HamburgerMenu } from './HamburgerMenu';
import { WelcomeSlides } from './WelcomeSlides';
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

  const showWelcome = location.pathname === '/' && !signedIn;
  const showVerification = location.pathname === '/signup';
  const showOnboarding = location.pathname === '/onboarding' && signedIn && !onboardingComplete;

  const mainContent = showVerification ? (
    <Verification onVerify={onVerify} />
  ) : showOnboarding ? (
    <Onboarding user={user} onComplete={completeOnboarding} />
  ) : showWelcome ? (
    <WelcomeSlides onSignIn={signInDev} />
  ) : (
    <Outlet />
  );

  return (
    <div className="layout">
      <header className="app-header">
        <button
          type="button"
          className="hamburger-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <span className="hamburger-icon" aria-hidden />
          <span className="hamburger-icon" aria-hidden />
          <span className="hamburger-icon" aria-hidden />
        </button>
        <Link to="/" className="app-brand-link">
          <div className="app-brand-row">
            <img src="/icon.png" alt="" className="app-icon" width="40" height="40" />
            <h1 className="app-logo">DocYard</h1>
          </div>
          <p className="app-value">Secure property accounting. Trial balance to journal entry—processed in your browser. Not affiliated with any third-party software.</p>
        </Link>
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
        <div className="footer-line" />
        <p className="footer-trust">
          <span className="footer-trust-icon" aria-hidden>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </span>
          Your file is processed in your browser and is not uploaded to our servers.
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
          <span className="footer-logo">DocYard</span>
          <span className="footer-copy"> · Secure property accounting</span>
          <span className="footer-year"> · © {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
