import React, { useState, useMemo } from 'react';
import { getYardiJeRows, buildYardiJeExcel, downloadBlob } from '../lib/yardiExport';
import { ymdToMmDdYyyy } from '../lib/yardiExport';
import { ParsePreviewFeedback } from './ParsePreviewFeedback.jsx';
import { saveDocument } from '../lib/documents.js';

/** "01/2025" → last day as YYYY-MM-DD */
function getLastDayYmd(postMonth) {
  if (!postMonth || !/^\d{1,2}\/\d{4}$/.test(postMonth.trim())) return '';
  const [mm, yyyy] = postMonth.trim().split('/').map((n) => parseInt(n, 10));
  const lastDay = new Date(yyyy, mm, 0);
  return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
}

export function ParsePreviewTable({
  parsedRows,
  setParsedRows,
  docType,
  postMonth,
  journalDate,
  detectedType,
}) {
  const [view, setView] = useState('parsed'); // 'parsed' | 'yardi'
  const [editing, setEditing] = useState(null); // { r, c } or null
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveLabel, setSaveLabel] = useState('');
  const [saveType, setSaveType] = useState('both'); // 'yardi' | 'parsed' | 'both'
  const [saveSuccess, setSaveSuccess] = useState(false);

  const journalDateYmd = journalDate || (postMonth ? getLastDayYmd(postMonth) : '');
  const journalDateMmDdYyyy = journalDateYmd ? ymdToMmDdYyyy(journalDateYmd) : '';

  const yardiRows = useMemo(() => {
    if (!parsedRows?.length) return [];
    try {
      return getYardiJeRows(parsedRows, {
        postMonth: postMonth || undefined,
        journalDate: journalDateYmd || undefined,
        docType: docType === 'auto' ? 'auto' : docType,
      });
    } catch {
      return [];
    }
  }, [parsedRows, postMonth, journalDateYmd, docType]);

  const handleExport = () => {
    if (!parsedRows?.length) return;
    try {
      const blob = buildYardiJeExcel(parsedRows, {
        postMonth: postMonth || undefined,
        journalDate: journalDateYmd || undefined,
        docType: docType === 'auto' ? 'auto' : docType,
      });
      downloadBlob(blob, 'yardi_je_import.xlsx');
    } catch (e) {
      console.error(e);
    }
  };

  const addRow = () => {
    if (!parsedRows?.length) return;
    const colCount = Math.max(...parsedRows.map((r) => (Array.isArray(r) ? r.length : 0)), 1);
    setParsedRows([...parsedRows, Array(colCount).fill('')]);
  };

  const addColumn = () => {
    if (!parsedRows?.length) return;
    setParsedRows(parsedRows.map((row) => [...(Array.isArray(row) ? row : [row]), '']));
  };

  const setCell = (r, c, value) => {
    const next = parsedRows.map((row, i) => {
      const arr = Array.isArray(row) ? [...row] : [row];
      if (i === r) {
        while (arr.length <= c) arr.push('');
        arr[c] = value;
      }
      return arr;
    });
    setParsedRows(next);
  };

  const rows = view === 'parsed' ? parsedRows : yardiRows;
  const isParsed = view === 'parsed';
  const maxCols = rows.length ? Math.max(...rows.map((r) => (Array.isArray(r) ? r.length : 0)), 1) : 0;
  const getCell = (row, c) => (Array.isArray(row) ? row[c] : c === 0 ? row : '');

  const defaultSaveLabel = postMonth ? `Trial balance ${postMonth}` : 'Saved document';
  const openSaveModal = () => {
    setSaveLabel(defaultSaveLabel);
    setSaveType('both');
    setSaveSuccess(false);
    setShowSaveModal(true);
  };
  const handleSaveToDocuments = () => {
    saveDocument({
      label: saveLabel.trim() || defaultSaveLabel,
      type: saveType,
      parsedRows: parsedRows.map((r) => (Array.isArray(r) ? [...r] : [r])),
      docType,
      postMonth: postMonth || '',
      journalDate: journalDate || '',
      detectedType: detectedType || null,
    });
    setSaveSuccess(true);
    setTimeout(() => setShowSaveModal(false), 1200);
  };

  return (
    <div className="parse-preview">
      <ParsePreviewFeedback docType={docType} detectedType={detectedType} />
      <div className="parse-preview-header">
        <div className="parse-preview-tabs">
          <button
            type="button"
            className={`parse-tab ${view === 'parsed' ? 'active' : ''}`}
            onClick={() => setView('parsed')}
          >
            Parsed view
          </button>
          <button
            type="button"
            className={`parse-tab ${view === 'yardi' ? 'active' : ''}`}
            onClick={() => setView('yardi')}
          >
            Yardi view
          </button>
        </div>
        <p className="parse-preview-hint">
          {view === 'parsed'
            ? 'Your file as we read it. Edit cells, add rows or columns, then switch to Yardi view to see the export format.'
            : 'This is what the downloaded file will look like. Export when ready.'}
        </p>
        <div className="parse-preview-actions">
          {isParsed && (
            <>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addRow}>
                + Row
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addColumn}>
                + Column
              </button>
            </>
          )}
          <button type="button" className="btn btn-primary" onClick={handleExport}>
            Export to Excel
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={openSaveModal} title="Save to Documents">
            Save to Documents
          </button>
        </div>
        <p className="parse-preview-scroll-hint">Scroll left and right to see all columns.</p>
      </div>

      {showSaveModal && (
        <div className="save-doc-modal-backdrop" onClick={() => !saveSuccess && setShowSaveModal(false)}>
          <div className="save-doc-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Save to Documents">
            <div className="save-doc-modal-header">
              <span className="save-doc-modal-title">Save to Documents</span>
              <button type="button" className="save-doc-modal-close" onClick={() => !saveSuccess && setShowSaveModal(false)} aria-label="Close">×</button>
            </div>
            {saveSuccess ? (
              <p className="save-doc-modal-thanks">Saved. Find it in Documents.</p>
            ) : (
              <form className="save-doc-modal-form" onSubmit={(e) => { e.preventDefault(); handleSaveToDocuments(); }}>
                <label className="save-doc-label" htmlFor="save-doc-label">Label</label>
                <input
                  id="save-doc-label"
                  type="text"
                  className="save-doc-input"
                  value={saveLabel}
                  onChange={(e) => setSaveLabel(e.target.value)}
                  placeholder="e.g. Trial balance 01/2025"
                />
                <span className="save-doc-label save-doc-sublabel">Save as</span>
                <div className="save-doc-type-options">
                  <label className="save-doc-radio">
                    <input type="radio" name="saveType" value="yardi" checked={saveType === 'yardi'} onChange={() => setSaveType('yardi')} />
                    <span>Yardi export only</span>
                  </label>
                  <label className="save-doc-radio">
                    <input type="radio" name="saveType" value="parsed" checked={saveType === 'parsed'} onChange={() => setSaveType('parsed')} />
                    <span>Parsed view only</span>
                  </label>
                  <label className="save-doc-radio">
                    <input type="radio" name="saveType" value="both" checked={saveType === 'both'} onChange={() => setSaveType('both')} />
                    <span>Both</span>
                  </label>
                </div>
                <div className="save-doc-modal-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowSaveModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      <div className="parse-preview-table-wrap">
        <table className="parse-preview-table">
          <thead>
            <tr>
              {Array.from({ length: maxCols }, (_, c) => (
                <th key={c}>{String(getCell(rows[0], c) ?? '')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(1).map((row, r) => (
              <tr key={r}>
                {Array.from({ length: maxCols }, (_, c) => (
                  <td key={c}>
                    {isParsed && editing?.r === r + 1 && editing?.c === c ? (
                      <input
                        className="parse-cell-input"
                        value={String(getCell(row, c) ?? '')}
                        onChange={(e) => setCell(r + 1, c, e.target.value)}
                        onBlur={() => setEditing(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditing(null)}
                        autoFocus
                      />
                    ) : (
                      <span
                        role="button"
                        tabIndex={0}
                        className={`parse-cell-value ${!String(getCell(row, c) ?? '').trim() ? 'parse-cell-empty' : ''}`}
                        onClick={() => isParsed && setEditing({ r: r + 1, c })}
                        onKeyDown={(e) => isParsed && (e.key === 'Enter' || e.key === ' ') && setEditing({ r: r + 1, c })}
                      >
                        {String(getCell(row, c) ?? '') || '\u00a0'}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
