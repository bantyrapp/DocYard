import React from 'react';
import { Link } from 'react-router-dom';

/* Platform marks: SVGs in /public from Simple Icons (MIT) — https://simpleicons.org */

const WIN_URL = import.meta.env.VITE_DOWNLOAD_WIN_URL || '';
const MAC_URL = import.meta.env.VITE_DOWNLOAD_MAC_URL || '';
const LINUX_URL = import.meta.env.VITE_DOWNLOAD_LINUX_URL || '';

function DownloadArrowIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

const PLATFORMS = [
  {
    id: 'windows',
    name: 'Windows',
    tag: '10 & 11',
    detail: '64-bit installer',
    url: WIN_URL,
    icon: '/platform-windows.svg',
    btnLabel: 'Download for Windows',
  },
  {
    id: 'macos',
    name: 'macOS',
    tag: 'Apple Silicon & Intel',
    detail: 'Disk image (.dmg)',
    url: MAC_URL,
    icon: '/platform-apple.svg',
    btnLabel: 'Download for Mac',
  },
  {
    id: 'linux',
    name: 'Linux',
    tag: '64-bit',
    detail: 'AppImage',
    url: LINUX_URL,
    icon: '/platform-linux.svg',
    btnLabel: 'Download for Linux',
  },
];

export function Download() {
  return (
    <div className="page download-page">
      <div className="page-inner download-inner">
        <header className="download-hero">
          <p className="download-eyebrow">Desktop app</p>
          <h1 className="page-title download-title">Download EazyBookz</h1>
          <p className="download-intro">
            Same trial balance → Yardi workflow as the web app, packaged for your computer. Works offline after install.
          </p>
        </header>

        <div className="download-grid">
          {PLATFORMS.map((p) => (
            <article key={p.id} className="download-card" data-platform={p.id}>
              <div className={`download-platform-mark download-platform-mark--${p.id}`} aria-hidden>
                <img src={p.icon} alt="" width={28} height={28} className="download-os-img" />
              </div>
              <h2 className="download-platform">{p.name}</h2>
              <p className="download-tag">{p.tag}</p>
              <p className="download-desc">{p.detail}</p>
              {p.url ? (
                <a href={p.url} className="btn btn-primary download-btn" download>
                  <DownloadArrowIcon size={18} className="download-btn-icon" />
                  {p.btnLabel}
                </a>
              ) : (
                <p className="download-soon">Installer coming soon</p>
              )}
            </article>
          ))}
        </div>

        <div className="download-web-cta">
          <p>No install needed?</p>
          <Link to="/" className="download-web-link">
            Use EazyBookz in your browser →
          </Link>
        </div>

        <p className="download-back">
          <Link to="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
