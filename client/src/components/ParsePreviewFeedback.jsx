import React, { useState } from 'react';
import { addLearnedFromFeedback } from '../lib/feedbackLearner.js';
import { RATING_SCALE, getCategoryOptions, getScoreLabel, LOW_SCORE_MAX } from '../lib/feedbackConfig.js';

const API = '/api';
const STORAGE_KEY = 'docyard_parse_feedback';

function saveToStorage(entry) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push({ ...entry, id: Date.now(), createdAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (_) {}
}

export function ParsePreviewFeedback({ docType, detectedType, headerRow }) {
  const [score, setScore] = useState(null);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const categoryOptions = getCategoryOptions();
  const selectedCategoryMeta = categoryOptions.find((c) => c.value === category);
  const subcategories = selectedCategoryMeta?.subcategories || {};
  const showCategory = score != null && score <= LOW_SCORE_MAX;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (score == null) return;
    setSending(true);
    const type = score >= 4 ? 'good' : score <= 2 ? 'bad' : 'neutral';
    const payload = {
      score,
      scoreLabel: getScoreLabel(score),
      type,
      message: message.trim() || undefined,
      context: 'parse_preview',
      category: category || undefined,
      subcategory: subcategory || undefined,
      tags: [docType || 'auto', detectedType || ''].filter(Boolean),
      headerRow: headerRow || undefined,
    };

    if (score <= LOW_SCORE_MAX) {
      addLearnedFromFeedback({
        type: 'bad',
        message: payload.message,
        headerRow: headerRow || undefined,
      });
    }

    try {
      const res = await fetch(`${API}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Feedback request failed');
    } catch (_) {
      saveToStorage(payload);
    } finally {
      setSending(false);
      setSubmitted(true);
      setScore(null);
      setCategory('');
      setSubcategory('');
      setMessage('');
    }
  };

  if (submitted) {
    return (
      <div className="parse-preview-feedback parse-preview-feedback--thanks">
        <p className="parse-preview-feedback-thanks">Thanks. Your feedback helps us improve.</p>
      </div>
    );
  }

  return (
    <div className="parse-preview-feedback">
      <p className="parse-preview-feedback-heading">How did we do?</p>
      <p className="parse-preview-feedback-hint">Rate 1–5 and pick a category if something was wrong; we use this to improve column detection.</p>
      <form className="parse-preview-feedback-form" onSubmit={handleSubmit}>
        <div className="parse-preview-feedback-scale-wrap">
          <div className="parse-preview-feedback-scale" role="group" aria-label="Rating 1 to 5">
            {[...RATING_SCALE].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`parse-preview-feedback-scale-btn ${score === value ? 'active' : ''}`}
                onClick={() => { setScore(value); setSubcategory(''); }}
                aria-pressed={score === value}
                aria-label={`${value}: ${label}`}
                title={label}
              >
                {value}
              </button>
            ))}
          </div>
          {score != null && (
            <p className="parse-preview-feedback-scale-desc">
              {RATING_SCALE.find((r) => r.value === score)?.label}
            </p>
          )}
        </div>

        {showCategory && (
          <>
            <label className="parse-preview-feedback-label" htmlFor="parse-feedback-category">
              What was wrong?
            </label>
            <select
              id="parse-feedback-category"
              className="parse-preview-feedback-select"
              value={category}
              onChange={(e) => { setCategory(e.target.value); setSubcategory(''); }}
            >
              <option value="">Select…</option>
              {categoryOptions.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {Object.keys(subcategories).length > 0 && category && (
              <select
                className="parse-preview-feedback-select"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
              >
                <option value="">Optional details…</option>
                {Object.entries(subcategories).map(([val, lbl]) => (
                  <option key={val} value={val}>{lbl}</option>
                ))}
              </select>
            )}
          </>
        )}

        <label className="parse-preview-feedback-label" htmlFor="parse-feedback-message">
          Anything to add? (optional)
        </label>
        <textarea
          id="parse-feedback-message"
          className="parse-preview-feedback-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. Account column was labeled 'Account Code'…"
          rows={2}
        />
        <button
          type="submit"
          className="btn btn-ghost btn-sm parse-preview-feedback-submit"
          disabled={score == null || sending}
        >
          {sending ? 'Sending…' : 'Send feedback'}
        </button>
      </form>
    </div>
  );
}
