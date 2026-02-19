import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const API = '/api';

export function Admin() {
  const [key, setKey] = useState('');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoad = async (e) => {
    e.preventDefault();
    setError('');
    setStats(null);
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/stats?key=${encodeURIComponent(key)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Invalid key');
        return;
      }
      setStats(data);
    } catch (e) {
      setError('Could not load stats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page admin-page">
      <div className="page-inner admin-inner">
        <h1 className="page-title">Admin</h1>
        <p className="admin-hint">Enter your admin key to view download stats.</p>

        <form className="admin-form" onSubmit={handleLoad}>
          <input
            type="password"
            className="admin-key-input"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Admin key"
            autoComplete="off"
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Loading…' : 'View stats'}
          </button>
        </form>

        {error && <p className="error-msg admin-error" role="alert">{error}</p>}

        {stats && (
          <div className="admin-stats">
            <div className="admin-stat-card">
              <p className="admin-stat-value">{stats.exportCount ?? 0}</p>
              <p className="admin-stat-label">Total exports (downloads)</p>
            </div>
            {stats.recent && stats.recent.length > 0 && (
              <div className="admin-recent">
                <h2 className="admin-recent-title">Recent exports</h2>
                <ul className="admin-recent-list">
                  {stats.recent.slice(0, 20).map((r, i) => (
                    <li key={i} className="admin-recent-item">
                      {new Date(r.at).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <p className="admin-back">
          <Link to="/">← Back to EazyBooks</Link>
        </p>
      </div>
    </div>
  );
}
