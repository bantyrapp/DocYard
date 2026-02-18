import React, { useState } from 'react';

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

export function ParsePreviewFeedback({ docType, detectedType }) {
  const [rating, setRating] = useState(null); // 'good' | 'bad'
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating == null) return;
    setSending(true);
    const payload = {
      type: rating,
      message: message.trim() || undefined,
      context: 'parse_preview',
      tags: [docType || 'auto', detectedType || ''].filter(Boolean),
    };
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
      setRating(null);
      setMessage('');
    }
  };

  if (submitted) {
    return (
      <div className="parse-preview-feedback parse-preview-feedback--thanks">
        <p className="parse-preview-feedback-thanks">Thanks—your feedback helps us improve.</p>
      </div>
    );
  }

  return (
    <div className="parse-preview-feedback">
      <p className="parse-preview-feedback-heading">How did we do?</p>
      <p className="parse-preview-feedback-hint">Your feedback trains our parsing so we get better over time.</p>
      <form className="parse-preview-feedback-form" onSubmit={handleSubmit}>
        <div className="parse-preview-feedback-vote">
          <button
            type="button"
            className={`parse-preview-feedback-btn up ${rating === 'good' ? 'active' : ''}`}
            onClick={() => setRating('good')}
            aria-pressed={rating === 'good'}
            aria-label="Good"
          >
            Like
          </button>
          <button
            type="button"
            className={`parse-preview-feedback-btn down ${rating === 'bad' ? 'active' : ''}`}
            onClick={() => setRating('bad')}
            aria-pressed={rating === 'bad'}
            aria-label="Could be better"
          >
            Dislike
          </button>
        </div>
        <label className="parse-preview-feedback-label" htmlFor="parse-feedback-message">
          Anything to add? (optional)
        </label>
        <textarea
          id="parse-feedback-message"
          className="parse-preview-feedback-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What was right or wrong with the parse…"
          rows={2}
        />
        <button
          type="submit"
          className="btn btn-ghost btn-sm parse-preview-feedback-submit"
          disabled={rating == null || sending}
        >
          {sending ? 'Sending…' : 'Send feedback'}
        </button>
      </form>
    </div>
  );
}
