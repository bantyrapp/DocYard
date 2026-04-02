import React, { useState, useEffect } from 'react';

const HINTS = [
  { text: 'Trial balance or balance sheet in → Yardi JE rows out (one line per entry).', tag: 'feature' },
  { text: 'One file = one export. Many files = one combined workbook by month.', tag: 'feature' },
  { text: 'All processing happens locally—nothing is uploaded.', tag: 'privacy' },
  { text: 'We look for Account, Debit, Credit (or Balance) in your headers.', tag: 'format' },
  { text: 'Post month = accounting period. Journal date = line date. Property often comes from the filename.', tag: 'tips' },
  { text: 'Next up: match their GL names to your chart of accounts.', tag: 'soon' },
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
