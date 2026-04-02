import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments, deleteDocument, updateDocument, duplicateDocument, formatDocType, formatDateTime, formatRelativeTime } from '../lib/documents.js';
import { buildYardiJeExcel, downloadBlob, getYardiJeRows, downloadCsv } from '../lib/yardiExport.js';
import '../App.css';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'label', label: 'A–Z' },
];

function DocumentIcon() {
  return (
    <svg width="32" height="40" viewBox="0 0 24 30" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v24a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="16" y2="18" />
      <line x1="8" y1="22" x2="12" y2="22" />
    </svg>
  );
}

function StarIcon({ filled }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export function Documents() {
  const [docs, setDocs] = useState(getDocuments);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const navigate = useNavigate();

  const refresh = useCallback(() => setDocs(getDocuments()), []);

  const filteredAndSorted = useMemo(() => {
    let list = docs;
    const q = search.trim().toLowerCase();
    if (q) {
      const typeStr = (t) => formatDocType(t).toLowerCase();
      list = list.filter(
        (d) =>
          (d.label || '').toLowerCase().includes(q) ||
          (d.postMonth || '').toLowerCase().includes(q) ||
          typeStr(d.type).includes(q) ||
          (d.type === 'yardi' && q.includes('yardi')) ||
          (d.type === 'parsed' && q.includes('parsed')) ||
          (d.type === 'both' && q.includes('both'))
      );
    }
    const pinned = list.filter((d) => d.pinned);
    const unpinned = list.filter((d) => !d.pinned);
    const sort = (arr) => {
      if (sortBy === 'newest') return [...arr].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (sortBy === 'oldest') return [...arr].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      if (sortBy === 'updated') return [...arr].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      if (sortBy === 'label') return [...arr].sort((a, b) => (a.label || '').localeCompare(b.label || ''));
      return arr;
    };
    return [...sort(pinned), ...sort(unpinned)];
  }, [docs, search, sortBy]);

  const handleOpen = (doc) => {
    try {
      sessionStorage.setItem('docyard_open_doc', JSON.stringify(doc));
      navigate('/');
    } catch (_) {}
  };

  const handleDownload = (doc) => {
    if (!doc.parsedRows?.length) return;
    try {
      const blob = buildYardiJeExcel(doc.parsedRows, {
        postMonth: doc.postMonth || undefined,
        journalDate: doc.journalDate || undefined,
        docType: doc.docType || 'auto',
      });
      const base = (doc.label || 'yardi_export').replace(/[^\w\s-]/g, '');
      downloadBlob(blob, `${base}_yardi.xlsx`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadCsv = (doc) => {
    if (!doc.parsedRows?.length) return;
    try {
      const rows = getYardiJeRows(doc.parsedRows, {
        postMonth: doc.postMonth || undefined,
        journalDate: doc.journalDate || undefined,
        docType: doc.docType || 'auto',
      });
      const base = (doc.label || 'export').replace(/[^\w\s-]/g, '');
      downloadCsv(rows, `${base}_yardi.csv`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    deleteDocument(id);
    refresh();
  };

  const handlePin = (id) => {
    const doc = docs.find((d) => d.id === id);
    if (!doc) return;
    updateDocument(id, { pinned: !doc.pinned });
    refresh();
  };

  const startRename = (doc) => {
    setEditingId(doc.id);
    setEditLabel(doc.label || '');
  };
  const saveRename = () => {
    if (editingId && editLabel.trim()) {
      updateDocument(editingId, { label: editLabel.trim() });
      refresh();
    }
    setEditingId(null);
    setEditLabel('');
  };
  const cancelRename = () => {
    setEditingId(null);
    setEditLabel('');
  };

  const handleDuplicate = (doc) => {
    duplicateDocument(doc.id);
    refresh();
  };

  return (
    <div className="documents-page page">
      <div className="page-inner documents-inner">
        <header className="documents-header">
          <h1 className="documents-title">Documents</h1>
          <p className="documents-intro">Saved parses and exports. Search or sort below.</p>
        </header>
        {docs.length === 0 ? (
          <div className="documents-empty">
            <p className="documents-empty-text">No documents yet.</p>
            <p className="documents-empty-hint">From Home, upload a file—then use <strong>Save to Documents</strong> in the preview.</p>
          </div>
        ) : (
          <>
            <div className="documents-toolbar">
              <span className="documents-search-wrap">
                <span className="documents-search-icon" aria-hidden><SearchIcon /></span>
                <input
                  type="search"
                  className="documents-search"
                  placeholder="Search documents…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search documents"
                />
                {search.trim() && (
                  <button type="button" className="documents-search-clear" onClick={() => setSearch('')} aria-label="Clear search">×</button>
                )}
              </span>
              <select
                className="documents-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {filteredAndSorted.length === 0 ? (
              <div className="documents-empty documents-empty--filtered">
                <p className="documents-empty-text">No matches for &quot;{search.trim()}&quot;.</p>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSearch('')}>Clear search</button>
              </div>
            ) : (
              <>
                {search.trim() && (
                  <p className="documents-result-hint">{filteredAndSorted.length} of {docs.length} document{docs.length !== 1 ? 's' : ''}</p>
                )}
                <ul className="documents-list">
                {filteredAndSorted.map((doc) => (
                  <li key={doc.id} className={`document-card ${doc.pinned ? 'document-card--pinned' : ''}`}>
                    <button
                      type="button"
                      className={`document-pin-btn ${doc.pinned ? 'pinned' : ''}`}
                      onClick={() => handlePin(doc.id)}
                      aria-label={doc.pinned ? 'Unpin' : 'Pin to top'}
                      title={doc.pinned ? 'Unpin' : 'Pin to top'}
                    >
                      <StarIcon filled={!!doc.pinned} />
                    </button>
                    <div className="document-card-icon" aria-hidden>
                      <DocumentIcon />
                    </div>
                    <div className="document-card-body">
                      {editingId === doc.id ? (
                        <div className="document-card-rename">
                          <input
                            type="text"
                            className="document-rename-input"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            onBlur={saveRename}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') cancelRename(); }}
                            autoFocus
                            aria-label="Edit label"
                          />
                        </div>
                      ) : (
                        <h2 className="document-card-label">
                          {doc.label}
                          <button type="button" className="document-rename-trigger" onClick={() => startRename(doc)} aria-label="Rename">&#9998;</button>
                        </h2>
                      )}
                  <p className="document-card-meta">
                    <span className="document-card-type">{formatDocType(doc.type)}</span>
                    {doc.postMonth && <span className="document-card-period"> · {doc.postMonth}</span>}
                  </p>
                  <p className="document-card-dates-line">
                    <span title={formatDateTime(doc.createdAt)}>Created {formatRelativeTime(doc.createdAt)}</span>
                    <span className="document-card-dates-sep"> · </span>
                    <span title={formatDateTime(doc.updatedAt)}>Updated {formatRelativeTime(doc.updatedAt)}</span>
                  </p>
                </div>
                <div className="document-card-actions">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleOpen(doc)}>Open</button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDownload(doc)}>Excel</button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDownloadCsv(doc)} title="For Google Sheets import">CSV</button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDuplicate(doc)} title="Duplicate">Duplicate</button>
                      <button type="button" className="btn btn-ghost btn-sm document-delete-btn" onClick={() => handleDelete(doc.id)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
