import React from 'react';
import { Link } from 'react-router-dom';

const WIN_URL = import.meta.env.VITE_DOWNLOAD_WIN_URL || '';
const MAC_URL = import.meta.env.VITE_DOWNLOAD_MAC_URL || '';
const LINUX_URL = import.meta.env.VITE_DOWNLOAD_LINUX_URL || '';

function DownloadIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function Download() {
  return (
    <div className="page download-page">
      <div className="page-inner download-inner">
        <h1 className="page-title download-page-title">
          <span className="download-page-title-icon" aria-hidden><DownloadIcon size={28} /></span>
          Download DocYard
        </h1>
        <p className="download-intro">
          Trial balance & balance sheet → Yardi journal entries. One file or full year. Free desktop app — works offline.
        </p>

        <div className="download-grid">
          <div className="download-card">
            <span className="download-icon" aria-hidden>🪟</span>
            <h2 className="download-platform">Windows</h2>
            <p className="download-desc">Windows 10 or 11</p>
            {WIN_URL ? (
              <a href={WIN_URL} className="btn btn-primary download-btn" download>
                <DownloadIcon size={18} className="download-btn-icon" />
                Download for Windows
              </a>
            ) : (
              <p className="download-placeholder">Build it free (see below)</p>
            )}
          </div>

          <div className="download-card">
            <span className="download-icon" aria-hidden>🍎</span>
            <h2 className="download-platform">macOS</h2>
            <p className="download-desc">Apple Silicon or Intel</p>
            {MAC_URL ? (
              <a href={MAC_URL} className="btn btn-primary download-btn" download>
                <DownloadIcon size={18} className="download-btn-icon" />
                Download for Mac
              </a>
            ) : (
              <p className="download-placeholder">Build it free (see below)</p>
            )}
          </div>

          <div className="download-card">
            <span className="download-icon" aria-hidden>🐧</span>
            <h2 className="download-platform">Linux</h2>
            <p className="download-desc">AppImage (64-bit)</p>
            {LINUX_URL ? (
              <a href={LINUX_URL} className="btn btn-primary download-btn" download>
                <DownloadIcon size={18} className="download-btn-icon" />
                Download for Linux
              </a>
            ) : (
              <p className="download-placeholder">Build it free (see below)</p>
            )}
          </div>
        </div>

        <div className="download-build-section">
          <h2 className="download-build-title">Build it yourself (free)</h2>
          <p className="download-build-intro">
            With Node.js: clone the repo, run <code>npm install</code> then <code>npm run electron:build</code>. Output is in <code>release/</code>.
          </p>
          <p className="download-build-note">
            Windows: <code>release\DocYard Setup *.exe</code>. Mac: <code>release/*.dmg</code>. Linux: <code>release/*.AppImage</code>.
          </p>
        </div>

        <p className="download-note">
          Or use DocYard in your browser — no download or sign-in required.
        </p>

        <p className="download-back">
          <Link to="/">← Back to DocYard</Link>
        </p>
      </div>
    </div>
  );
}
