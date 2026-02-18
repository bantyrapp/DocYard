import React from 'react';
import { Link } from 'react-router-dom';

const WIN_URL = import.meta.env.VITE_DOWNLOAD_WIN_URL || '';
const MAC_URL = import.meta.env.VITE_DOWNLOAD_MAC_URL || '';
const LINUX_URL = import.meta.env.VITE_DOWNLOAD_LINUX_URL || '';

export function Download() {
  return (
    <div className="page download-page">
      <div className="page-inner download-inner">
        <h1 className="page-title">Download DocYard</h1>
        <p className="download-intro">
          Desktop app for Windows, Mac, or Linux. Same experience, works offline.
        </p>

        <div className="download-grid">
          <div className="download-card">
            <span className="download-icon" aria-hidden>🪟</span>
            <h2 className="download-platform">Windows</h2>
            <p className="download-desc">Windows 10 or 11</p>
            {WIN_URL ? (
              <a href={WIN_URL} className="btn btn-primary download-btn" download>
                Download for Windows
              </a>
            ) : (
              <p className="download-placeholder">Soon. Use the web app for now.</p>
            )}
          </div>

          <div className="download-card">
            <span className="download-icon" aria-hidden>🍎</span>
            <h2 className="download-platform">macOS</h2>
            <p className="download-desc">Apple Silicon or Intel</p>
            {MAC_URL ? (
              <a href={MAC_URL} className="btn btn-primary download-btn" download>
                Download for Mac
              </a>
            ) : (
              <p className="download-placeholder">Soon. Use the web app for now.</p>
            )}
          </div>

          <div className="download-card">
            <span className="download-icon" aria-hidden>🐧</span>
            <h2 className="download-platform">Linux</h2>
            <p className="download-desc">AppImage (64-bit)</p>
            {LINUX_URL ? (
              <a href={LINUX_URL} className="btn btn-primary download-btn" download>
                Download for Linux
              </a>
            ) : (
              <p className="download-placeholder">Soon. Use the web app for now.</p>
            )}
          </div>
        </div>

        <p className="download-note">
          Or use DocYard in your browser—no download needed.
        </p>

        <p className="download-back">
          <Link to="/">← Back to DocYard</Link>
        </p>
      </div>
    </div>
  );
}
