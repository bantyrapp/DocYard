import React, { useState, useEffect } from 'react';

const HINTS = [
  { text: 'Upload a trial balance or balance sheet; we output Yardi-format journal entries (one row per line).', tag: 'feature' },
  { text: 'Single file = one JE file. Multiple files (e.g. 12 months) = one combined workbook.', tag: 'feature' },
  { text: 'Processed in your browser. Your file never leaves your device.', tag: 'privacy' },
  { text: 'We auto-detect from column headers: Account, Debit, Credit (or Balance).', tag: 'format' },
  { text: 'Post month = period (MM/YYYY). Journal date = date on each line. Property from filename or row 4.', tag: 'tips' },
  { text: 'Coming next: GL name matching — map their chart of accounts to yours.', tag: 'soon' },
];

export function NerdyHints() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % HINTS.length), 6000);
    return () => clearInterval(t);
  }, []);

  const hint = HINTS[idx];

  return (
    <div className="nerdy-hints">
      <button
        type="button"
        className="nerdy-hints-box"
        onClick={() => setIdx((i) => (i + 1) % HINTS.length)}
        aria-label="Next tip"
      >
        <span className="nerdy-hints-tag">{hint.tag}</span>
        <span className="nerdy-hints-text">{hint.text}</span>
      </button>
    </div>
  );
}
