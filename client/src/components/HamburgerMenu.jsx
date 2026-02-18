import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export function HamburgerMenu({ open, onClose, theme, onThemeChange, signedIn, onSignIn, onSignOut }) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="hamburger-backdrop" onClick={onClose} aria-hidden />
      <div className="hamburger-drawer" role="dialog" aria-label="Menu">
        <div className="hamburger-drawer-header">
          <span className="hamburger-drawer-title">Menu</span>
          <button
            type="button"
            className="hamburger-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>
        <nav className="hamburger-nav">
          {signedIn ? (
            <button type="button" className="hamburger-item" onClick={() => { onSignOut(); onClose(); }}>
              Sign out
            </button>
          ) : (
            <>
              <button type="button" className="hamburger-item" onClick={() => { onSignIn(); onClose(); }}>
                Sign in
              </button>
              <Link to="/signup" className="hamburger-item" onClick={onClose}>Create account</Link>
            </>
          )}
          <div className="hamburger-divider" aria-hidden />
          <Link to="/documents" className="hamburger-item" onClick={onClose}>Documents</Link>
          <Link to="/download" className="hamburger-item" onClick={onClose}>Download</Link>
          <Link to="/pricing" className="hamburger-item" onClick={onClose}>Pricing</Link>
          <Link to="/terms" className="hamburger-item" onClick={onClose}>Terms</Link>
          <Link to="/privacy" className="hamburger-item" onClick={onClose}>Privacy</Link>
          <div className="hamburger-divider" aria-hidden />
          <div className="hamburger-item hamburger-theme">
            <span className="hamburger-theme-label">Theme</span>
            <div className="hamburger-theme-options">
              <button
                type="button"
                className={`hamburger-theme-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => { onThemeChange('light'); onClose(); }}
              >
                Light
              </button>
              <button
                type="button"
                className={`hamburger-theme-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => { onThemeChange('dark'); onClose(); }}
              >
                Dark
              </button>
            </div>
          </div>
          <div className="hamburger-auth-row">
            Dev: toggle auth to see welcome vs app.
          </div>
          <button
            type="button"
            className="btn btn-ghost hamburger-dev-btn"
            onClick={() => {
              if (signedIn) onSignOut();
              else onSignIn();
              onClose();
            }}
          >
            {signedIn ? 'Sign out (dev)' : 'Sign in (dev)'}
          </button>
        </nav>
      </div>
    </>
  );
}
