import React, { useState, useEffect } from 'react';

const HINTS = [
  { text: 'Excel .xlsx or .xls only. First row = headers.', tag: 'format' },
  { text: 'Debits = credits. Always.', tag: 'accounting' },
  { text: 'Post month = period (MM/YYYY). Journal date = entry date.', tag: 'accounting' },
  { text: 'Runs in your browser. Your file never hits our server.', tag: 'privacy' },
  { text: 'Trial balance columns: Account, Description, Debit, Credit (or similar).', tag: 'format' },
  { text: '// TODO: reconcile with GL before posting', tag: 'code' },
  { text: 'Last day of month is auto-filled from post month.', tag: 'accounting' },
  { text: 'Import-ready output: one file, drop into your system.', tag: 'workflow' },
  { text: 'Balance sheet? We detect Account, Description, Debit/Credit (or Balance).', tag: 'format' },
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
