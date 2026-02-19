import React, { useState, useRef, useEffect } from 'react';
import {
  parseExcelFile,
  buildYardiJeExcel,
  downloadBlob,
  combineMultipleTrialBalances,
  getDetectedHeaderRow,
} from '../lib/yardiExport.js';
import { ParsePreviewTable } from './ParsePreviewTable.jsx';
import { FeedbackSection } from './FeedbackSection.jsx';

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
  const [downloadImmediately, setDownloadImmediately] = useState(false);
  const [parsedRows, setParsedRows] = useState(null);
  const [combinedYardiRows, setCombinedYardiRows] = useState(null);
  const [combinedParsedRows, setCombinedParsedRows] = useState(null);
  const [suggestedMultiFilename, setSuggestedMultiFilename] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    if (!initialDocument?.parsedRows?.length || !onLoadDocument) return;
    const rows = initialDocument.parsedRows.map((r) => (Array.isArray(r) ? [...r] : [r]));
    setParsedRows(rows);
    setCombinedYardiRows(null);
    setCombinedParsedRows(null);
    setDocType(initialDocument.docType || 'auto');
    setDetectedType(initialDocument.detectedType ?? null);
    onLoadDocument(initialDocument);
  }, [initialDocument, onLoadDocument]);

  const clearResult = () => {
    setParsedRows(null);
    setCombinedYardiRows(null);
    setCombinedParsedRows(null);
    setError('');
    setSuccess('');
    setDetectedType(null);
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.name?.endsWith('.xlsx') || f.name?.endsWith('.xls'));
    if (!files.length) {
      setError('Please choose one or more Excel files (.xlsx or .xls).');
      return;
    }
    clearResult();
    setLoading(true);
    try {
      if (files.length === 1) {
        const file = files[0];
        const { rows, detectedPeriod, detectedType: dt } = await parseExcelFile(file);
        if (!rows?.length) throw new Error('No data in workbook');
        if (dt) setDetectedType(dt);
        if (detectedPeriod && onPostMonthFromFile) onPostMonthFromFile(String(detectedPeriod).trim());
        const normalized = rows.map((row) => (Array.isArray(row) ? [...row] : [row]));
        setParsedRows(normalized);
        if (downloadImmediately) {
          const blob = buildYardiJeExcel(rows, {
            postMonth: postMonth || undefined,
            journalDate: journalDate || undefined,
            docType: docType === 'auto' ? 'auto' : docType,
            propertyName: propertyName?.trim() || undefined,
          });
          downloadBlob(blob, 'yardi_je_import.xlsx');
          setSuccess('Downloaded. You can also export again from the table below.');
          setTimeout(() => setSuccess(''), 5000);
        }
      } else {
        const { combinedRows, combinedParsedRows: parsed, suggestedName } = await combineMultipleTrialBalances(files, {
          docType: docType === 'auto' ? 'auto' : docType,
          propertyNameOverride: propertyName?.trim() || undefined,
        });
        setCombinedYardiRows(combinedRows || []);
        setCombinedParsedRows(parsed || []);
        setSuggestedMultiFilename(suggestedName || 'yardi_je_combined.xlsx');
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
    const files = e.dataTransfer?.files;
    if (files?.length) handleFiles(files);
  };

  const onFileInput = (e) => {
    const files = e.target?.files;
    if (files?.length) handleFiles(files);
    e.target.value = '';
  };

  const showFeedbackCard = !!(parsedRows?.length || success || combinedYardiRows?.length);
  const feedbackHeaderRow = parsedRows?.length ? getDetectedHeaderRow(parsedRows) : undefined;
  const isMultiResult = !!(combinedYardiRows?.length);

  return (
    <div className="card upload-card">
      {showFeedbackCard && (
        <div className="feedback-card-wrap">
          <FeedbackSection
            context={parsedRows?.length ? 'parse_preview' : 'general'}
            headerRow={feedbackHeaderRow}
          />
        </div>
      )}
      <div className="upload-how-it-works">
        <h2 className="upload-how-heading">How it works</h2>
        <p className="upload-how-p">
          Set your options below, then drop or select Excel file(s). <strong>One file</strong> = one month; you’ll see the original sheet and the Yardi format, then export when ready. <strong>Multiple files</strong> (e.g. 12 months) = we combine them by month into one workbook and show both views. Everything runs in your browser—your data never leaves your device.
        </p>
      </div>

      <div className="upload-options-block">
        <h3 className="upload-options-heading">Options</h3>
        <div className="upload-option download-immediately-row">
          <label className="download-immediately-label">
            <input
              type="checkbox"
              checked={downloadImmediately}
              onChange={(e) => setDownloadImmediately(e.target.checked)}
            />
            <span>Also download file immediately (single file only)</span>
          </label>
          <span className="download-immediately-hint">When on, we still show the table below so you can export again or save to Documents.</span>
        </div>
        <div className="doc-type-row">
          <label htmlFor="doc-type">Document type</label>
          <select
            id="doc-type"
            className="doc-type-select"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            title="We auto-detect from column headers (Account, Debit, Credit or Balance)."
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
              title="Period for entries (single file). For multiple files we use the filename, e.g. 1.2025 Fitz TB.xlsx → 01/2025."
            />
          </div>
          <div className="upload-option">
            <label>Journal date</label>
            <input
              type="date"
              className="post-date-input"
              value={journalDate || ''}
              onChange={(e) => setJournalDate?.(e.target.value || '')}
              title="Date on each journal entry line (e.g. last day of month)."
            />
          </div>
        </div>
        <div className="upload-option property-name-row">
          <label htmlFor="property-name-input">Property name</label>
          <input
            id="property-name-input"
            type="text"
            className="property-name-input"
            placeholder="e.g. Fitz (optional; we detect from file or sheet)"
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            title="Used in the Property_Name column. We detect from filename or sheet row if blank."
          />
        </div>
      </div>

      <div
        className={`upload-box upload-box-unified ${dragging ? 'dragging' : ''} ${loading ? 'loading' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !loading && fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !loading) fileRef.current?.click(); }}
        aria-label="Upload one or more Excel files"
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={onFileInput}
          aria-hidden
        />
        {loading ? (
          <div className="upload-loading">
            <span className="upload-spinner" aria-hidden />
            <span className="label">Processing…</span>
            <span className="hint">In your browser</span>
          </div>
        ) : (
          <>
            <div className="label">Drop Excel file(s) here or click to choose</div>
            <div className="hint">One file = one month. Multiple files = we combine by month into one Yardi workbook. Trial balance or balance sheet.</div>
          </>
        )}
      </div>

      {detectedType && !isMultiResult && (
        <p className="detected-type-msg" role="status">
          Detected: {detectedType === 'trial_balance' ? 'Trial balance' : 'Balance sheet'}
        </p>
      )}
      {error && <p className="error-msg" role="alert">{error}</p>}
      {success && <p className="success-msg" role="status">{success}</p>}

      {parsedRows && parsedRows.length > 0 && !isMultiResult && (
        <ParsePreviewTable
          parsedRows={parsedRows}
          setParsedRows={setParsedRows}
          docType={docType}
          postMonth={postMonth}
          journalDate={journalDate}
          detectedType={detectedType}
          propertyName={propertyName?.trim() || undefined}
        />
      )}

      {combinedYardiRows && combinedYardiRows.length > 0 && (
        <ParsePreviewTable
          combinedYardiRows={combinedYardiRows}
          combinedParsedRows={combinedParsedRows}
          suggestedMultiFilename={suggestedMultiFilename}
        />
      )}
    </div>
  );
}
