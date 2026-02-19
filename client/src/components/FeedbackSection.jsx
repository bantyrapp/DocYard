import React, { useState } from 'react';
import { addLearnedFromFeedback } from '../lib/feedbackLearner.js';
import { RATING_SCALE, getCategoryOptions, getScoreLabel, LOW_SCORE_MAX } from '../lib/feedbackConfig.js';
import './FeedbackSection.css';

const API = '/api';
const STORAGE_KEY = 'docyard_feedback';

function getStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItem(item) {
  const list = getStored();
  list.push({ ...item, id: Date.now(), createdAt: new Date().toISOString() });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (_) {}
}

export function FeedbackSection({ context = 'general', headerRow } = {}) {
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
      context: context || 'general',
      category: category || undefined,
      subcategory: subcategory || undefined,
      headerRow: Array.isArray(headerRow) ? headerRow : undefined,
    };

    if (score <= LOW_SCORE_MAX) {
      addLearnedFromFeedback({ type: 'bad', message: payload.message });
    }

    try {
      const res = await fetch(`${API}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Feedback request failed');
    } catch (_) {
      saveItem(payload);
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
      <section className="feedback-section" aria-live="polite">
        <div className="feedback-thanks-box">
          <p className="feedback-thanks">Thanks. Your feedback helps us improve.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="feedback-section feedback-section--card">
      <div className="feedback-line" />
      <h2 className="feedback-heading">How was that?</h2>
      <p className="feedback-hint">Rate 1-5 so we know exactly what to improve. Your feedback updates the parser for everyone.</p>
      <form className="feedback-form" onSubmit={handleSubmit}>
        <div className="feedback-rating-row">
          <span className="feedback-rating-label">Rating</span>
          <div className="feedback-scale" role="group" aria-label="Rating 1 to 5">
            {[...RATING_SCALE].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`feedback-scale-btn ${score === value ? 'active' : ''} ${value <= 2 ? 'low' : value >= 4 ? 'high' : 'mid'}`}
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
            <p className="feedback-scale-desc" aria-live="polite">
              {RATING_SCALE.find((r) => r.value === score)?.label}
            </p>
          )}
        </div>

        {showCategory && (
          <>
            <label className="feedback-message-label" htmlFor="feedback-category">
              What was wrong? (helps us fix the right thing)
            </label>
            <select
              id="feedback-category"
              className="feedback-select"
              value={category}
              onChange={(e) => { setCategory(e.target.value); setSubcategory(''); }}
            >
              <option value="">Select category…</option>
              {categoryOptions.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {Object.keys(subcategories).length > 0 && category && (
              <>
                <label className="feedback-message-label" htmlFor="feedback-subcategory">
                  Details
                </label>
                <select
                  id="feedback-subcategory"
                  className="feedback-select"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                >
                  <option value="">Optional…</option>
                  {Object.entries(subcategories).map(([val, lbl]) => (
                    <option key={val} value={val}>{lbl}</option>
                  ))}
                </select>
              </>
            )}
          </>
        )}

        <label className="feedback-message-label" htmlFor="feedback-message">
          Anything to add? (optional)
        </label>
        <textarea
          id="feedback-message"
          className="feedback-message-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. Account column was labeled 'Account Code'…"
          rows={2}
        />
        <button type="submit" className="btn btn-ghost btn-feedback-submit" disabled={score == null || sending}>
          {sending ? 'Sending…' : 'Send feedback'}
        </button>
      </form>
    </section>
  );
}
