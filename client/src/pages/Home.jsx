import React, { useState, useCallback, useEffect } from 'react';
import { UploadZone } from '../components/UploadZone';
import { NerdyHints } from '../components/NerdyHints';
import { loadServerLearnedRules } from '../lib/feedbackLearner.js';
import '../App.css';

const OPEN_DOC_KEY = 'docyard_open_doc';

function getInitialDocument() {
  try {
    const raw = sessionStorage.getItem(OPEN_DOC_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(OPEN_DOC_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

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
  const [initialDocument, setInitialDocument] = useState(null);

  useEffect(() => {
    const doc = getInitialDocument();
    if (doc) {
      setInitialDocument(doc);
      if (doc.postMonth) setExportPostMonth(doc.postMonth);
      if (doc.journalDate) setExportJournalDate(doc.journalDate);
    }
  }, []);

  useEffect(() => {
    loadServerLearnedRules();
  }, []);

  const onLoadDocument = useCallback((doc) => {
    if (doc?.postMonth) setExportPostMonth(doc.postMonth);
    if (doc?.journalDate) setExportJournalDate(doc.journalDate);
    setInitialDocument(null);
  }, []);

  const onPostMonthFromFile = useCallback((period) => {
    if (period) {
      setExportPostMonth(period);
      setExportJournalDate(getLastDayOfMonthYmd(period));
    }
  }, []);

  return (
    <div className="home-page home-page--input">
      <p className="home-intro">
        Excel trial balance or balance sheet → Yardi journal entry file. One month or many—same steps: preview, tweak, export.
        <span className="home-intro-privacy"> Runs in your browser; your file stays on your device.</span>
      </p>
      <NerdyHints />
      <UploadZone
        postMonth={exportPostMonth}
        setPostMonth={setExportPostMonth}
        journalDate={exportJournalDate}
        setJournalDate={setExportJournalDate}
        onPostMonthFromFile={onPostMonthFromFile}
        initialDocument={initialDocument}
        onLoadDocument={onLoadDocument}
      />
    </div>
  );
}
