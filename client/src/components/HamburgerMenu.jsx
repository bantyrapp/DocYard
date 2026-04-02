import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './HamburgerMenu.css';

function CloseGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function LockGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

export function HamburgerMenu({ open, onClose, theme, onThemeChange, signedIn, onSignIn, onSignOut }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEscape);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const isDev = import.meta.env.DEV;

  return (
    <div
      className="hamburger-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      <div className="hamburger-overlay-top">
        <div className="hamburger-overlay-brand">
          <img src="/icon.png" alt="" className="hamburger-overlay-logo" width="32" height="32" />
          <span className="hamburger-overlay-name">EazyBookz</span>
        </div>
        <div className="hamburger-overlay-actions">
          <button type="button" className="hamburger-close-pill" onClick={onClose}>
            Close
          </button>
          <button
            ref={closeRef}
            type="button"
            className="hamburger-close-icon"
            onClick={onClose}
            aria-label="Close menu"
          >
            <CloseGlyph />
          </button>
        </div>
      </div>

      <div className="hamburger-overlay-body">
        <div className="hamburger-privacy-banner" role="status">
          <div className="hamburger-privacy-icon">
            <LockGlyph />
          </div>
          <div className="hamburger-privacy-copy">
            <p className="hamburger-privacy-title">Your files stay on your device</p>
            <p className="hamburger-privacy-text">
              The main Excel → Yardi flow runs in your browser. We don’t upload your workbook for that
              step—nothing is stored on our servers for the conversion you just did.
            </p>
          </div>
        </div>

        <div>
          <p className="hamburger-section-label">Account</p>
          <nav className="hamburger-nav-block" aria-label="Account">
            {signedIn ? (
              <button type="button" className="hamburger-nav-action" onClick={() => { onSignOut(); onClose(); }}>
                Sign out
              </button>
            ) : (
              <>
                <button type="button" className="hamburger-nav-action" onClick={() => { onSignIn(); onClose(); }}>
                  Sign in
                </button>
                <Link to="/signup" className="hamburger-nav-link" onClick={onClose}>
                  Create account
                </Link>
              </>
            )}
          </nav>
        </div>

        <div>
          <p className="hamburger-section-label">App</p>
          <nav className="hamburger-nav-block" aria-label="Main pages">
            <Link to="/documents" className="hamburger-nav-link" onClick={onClose}>
              Documents
            </Link>
            <Link to="/download" className="hamburger-nav-link" onClick={onClose}>
              Download
            </Link>
            <Link to="/pricing" className="hamburger-nav-link" onClick={onClose}>
              Pricing
            </Link>
            <Link to="/about" className="hamburger-nav-link" onClick={onClose}>
              About
            </Link>
          </nav>
        </div>

        <div>
          <p className="hamburger-section-label">Legal</p>
          <nav className="hamburger-nav-block" aria-label="Legal">
            <Link to="/terms" className="hamburger-nav-link hamburger-nav-muted" onClick={onClose}>
              Terms
            </Link>
            <Link to="/privacy" className="hamburger-nav-link hamburger-nav-muted" onClick={onClose}>
              Privacy
            </Link>
          </nav>
        </div>

        <div className="hamburger-theme-row">
          <span className="hamburger-theme-label" id="hamburger-theme-label">
            Appearance
          </span>
          <div className="hamburger-theme-toggle" role="group" aria-labelledby="hamburger-theme-label">
            <button
              type="button"
              className={theme === 'light' ? 'active' : ''}
              onClick={() => onThemeChange('light')}
              aria-pressed={theme === 'light'}
            >
              Light
            </button>
            <button
              type="button"
              className={theme === 'dark' ? 'active' : ''}
              onClick={() => onThemeChange('dark')}
              aria-pressed={theme === 'dark'}
            >
              Dark
            </button>
          </div>
        </div>

        {isDev && (
          <div className="hamburger-dev">
            <p className="hamburger-dev-note">Development only</p>
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
          </div>
        )}
      </div>

      <div className="hamburger-bottom-close">
        <button type="button" onClick={onClose}>
          Close menu
        </button>
      </div>
    </div>
  );
}
