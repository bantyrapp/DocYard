import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { UploadZone } from '../components/UploadZone';
import { FeedbackSection } from '../components/FeedbackSection';
import { NerdyHints } from '../components/NerdyHints';
import { downloadYardiJeTemplate, downloadTrialBalanceTemplate, downloadBalanceSheetTemplate, downloadRealEstateGLReference } from '../lib/yardiExport';
import '../App.css';

function getCurrentPostMonth() {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Last day of month MM/YYYY as YYYY-MM-DD */
function getLastDayOfMonthYmd(postMonth) {
  if (!postMonth || !/^\d{1,2}\/\d{4}$/.test(postMonth.trim())) return '';
  const [mm, yyyy] = postMonth.trim().split('/').map((n) => parseInt(n, 10));
  const lastDay = new Date(yyyy, mm, 0);
  return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
}

export function Home() {
  const [exportPostMonth, setExportPostMonth] = useState(getCurrentPostMonth);
  const [exportJournalDate, setExportJournalDate] = useState(() => getLastDayOfMonthYmd(getCurrentPostMonth()));

  const onPostMonthFromFile = useCallback((period) => {
    if (period) {
      setExportPostMonth(period);
      setExportJournalDate(getLastDayOfMonthYmd(period));
    }
  }, []);

  return (
    <div className="home-page">
      <p className="home-intro">Trial balance → journal entry. Works offline in your browser. Set post month and date, upload Excel, get an import-ready file.</p>
      <NerdyHints />
      <UploadZone
        postMonth={exportPostMonth}
        setPostMonth={setExportPostMonth}
        journalDate={exportJournalDate}
        setJournalDate={setExportJournalDate}
        onPostMonthFromFile={onPostMonthFromFile}
      />
      <section className="templates-section">
        <div className="templates-line" />
        <p className="templates-title">Excel templates</p>
        <p className="templates-hint">Blank templates and a GL reference for property accounting.</p>
        <div className="templates-buttons">
          <button type="button" className="btn btn-ghost btn-template" onClick={downloadYardiJeTemplate}>
            Journal entry template
          </button>
          <button type="button" className="btn btn-ghost btn-template" onClick={downloadTrialBalanceTemplate}>
            Trial balance template
          </button>
          <button type="button" className="btn btn-ghost btn-template" onClick={downloadBalanceSheetTemplate}>
            Balance sheet template
          </button>
          <button type="button" className="btn btn-ghost btn-template" onClick={downloadRealEstateGLReference}>
            Real estate GL reference
          </button>
        </div>
      </section>
      <section className="home-cta">
        <div className="home-cta-line" />
        <p className="home-cta-text">Free now. Payments soon.</p>
        <div className="home-cta-buttons">
          <Link to="/pricing" className="btn btn-primary btn-cta">Pricing</Link>
          <Link to="/download" className="btn btn-ghost btn-cta">Download app</Link>
        </div>
      </section>
      <FeedbackSection />
    </div>
  );
}
