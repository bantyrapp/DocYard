import React, { useState, useRef, useEffect } from 'react';
import {
  parseExcelFile,
  buildYardiJeExcel,
  downloadBlob,
} from '../lib/yardiExport.js';
import { ParsePreviewTable } from './ParsePreviewTable.jsx';

/** "01/2025" → last day as "YYYY-MM-DD" */
function getLastDayOfMonthYmdLocal(postMonth) {
  if (!postMonth || !/^\d{1,2}\/\d{4}$/.test(postMonth.trim())) return '';
  const [mm, yyyy] = postMonth.trim().split('/').map((n) => parseInt(n, 10));
  const lastDay = new Date(yyyy, mm, 0);
  return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
}

const DOC_TYPES = [
  { value: 'auto', label: 'Auto (trial balance or balance sheet)' },
  { value: 'trial_balance', label: 'Trial balance' },
  { value: 'balance_sheet', label: 'Balance sheet' },
];

export function UploadZone({ postMonth, setPostMonth, journalDate, setJournalDate, onPostMonthFromFile, initialDocument, onLoadDocument }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragging, setDragging] = useState(false);
  const [docType, setDocType] = useState('auto');
  const [detectedType, setDetectedType] = useState(null);
  const [downloadImmediately, setDownloadImmediately] = useState(true);
  const [parsedRows, setParsedRows] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    if (!initialDocument?.parsedRows?.length || !onLoadDocument) return;
    const rows = initialDocument.parsedRows.map((r) => (Array.isArray(r) ? [...r] : [r]));
    setParsedRows(rows);
    setDocType(initialDocument.docType || 'auto');
    setDetectedType(initialDocument.detectedType ?? null);
    onLoadDocument(initialDocument);
  }, [initialDocument, onLoadDocument]);

  const handleFile = async (file) => {
    setError('');
    setSuccess('');
    setDetectedType(null);
    setParsedRows(null);
    setLoading(true);
    try {
      const { rows, detectedPeriod, detectedType: dt } = await parseExcelFile(file);
      if (!rows?.length) throw new Error('No data in workbook');

      if (dt) setDetectedType(dt);
      if (detectedPeriod && onPostMonthFromFile) onPostMonthFromFile(String(detectedPeriod).trim());

      setParsedRows(rows.map((row) => (Array.isArray(row) ? [...row] : [row])));

      if (downloadImmediately) {
        const blob = buildYardiJeExcel(rows, {
          postMonth: postMonth || undefined,
          journalDate: journalDate || undefined,
          docType: docType === 'auto' ? 'auto' : docType,
        });
        downloadBlob(blob, 'yardi_je_import.xlsx');
        setSuccess('Downloaded.');
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) handleFile(file);
    else setError('Please upload an Excel file (.xlsx or .xls).');
  };

  const onFileInput = (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    handleFile(file);
    e.target.value = '';
  };

  return (
    <div className="card upload-card">
      <p className="upload-flow-hint">Set post month and date, then drop your file.</p>
      <div className="upload-option download-immediately-row">
        <label className="download-immediately-label">
          <input
            type="checkbox"
            checked={downloadImmediately}
            onChange={(e) => setDownloadImmediately(e.target.checked)}
          />
          <span>Download immediately</span>
        </label>
        <span className="download-immediately-hint">When off, you’ll see the parsed table and Yardi preview before exporting.</span>
      </div>
      <div className="doc-type-row">
        <label htmlFor="doc-type">Document type</label>
        <select
          id="doc-type"
          className="doc-type-select"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          title="Trial balance has Account, Debit, Credit. Balance sheet can have different column names; we detect them."
        >
          {DOC_TYPES.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="upload-options-row">
        <div className="upload-option">
          <label>Post month</label>
          <input
            type="month"
            className="post-month-input"
            value={postMonth ? `${postMonth.slice(3, 7)}-${postMonth.slice(0, 2)}` : ''}
            onChange={(e) => {
              const v = e.target.value;
              if (!v || !setPostMonth) return;
              const [y, m] = v.split('-');
              const newMonth = `${m}/${y}`;
              setPostMonth(newMonth);
              if (setJournalDate) setJournalDate(getLastDayOfMonthYmdLocal(newMonth));
            }}
            title="Post month (MM/YYYY) for the journal entry"
          />
        </div>
        <div className="upload-option">
          <label>Journal date (post date)</label>
          <input
            type="date"
            className="post-date-input"
            value={journalDate || ''}
            onChange={(e) => setJournalDate?.(e.target.value || '')}
            title="Exact date used in the journal entry"
          />
        </div>
      </div>
      <div
        className={`upload-box upload-box-single ${dragging ? 'dragging' : ''} ${loading ? 'loading' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !loading && fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !loading) fileRef.current?.click(); }}
        aria-label="Upload Excel file"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={onFileInput}
          aria-hidden
        />
        {loading ? (
          <div className="upload-loading">
            <span className="upload-spinner" aria-hidden />
            <span className="label">Creating journal entry…</span>
            <span className="hint">In your browser</span>
          </div>
        ) : (
          <>
            <div className="label">Drop Excel file or click to upload</div>
            <div className="hint">Trial balance or balance sheet · processed in your browser, not sent to our servers</div>
          </>
        )}
      </div>
      {detectedType && (
        <p className="detected-type-msg" role="status">
          Detected: {detectedType === 'trial_balance' ? 'Trial balance' : 'Balance sheet'}
        </p>
      )}
      {error && <p className="error-msg" role="alert">{error}</p>}
      {success && <p className="success-msg" role="status">{success}</p>}

      {parsedRows && parsedRows.length > 0 && (
        <ParsePreviewTable
          parsedRows={parsedRows}
          setParsedRows={setParsedRows}
          docType={docType}
          postMonth={postMonth}
          journalDate={journalDate}
          detectedType={detectedType}
        />
      )}
    </div>
  );
}
