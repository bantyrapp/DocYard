import React, { useState } from 'react';
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
  } catch (_) {
    /* storage full or unavailable */
  }
}

export function FeedbackSection() {
  const [rating, setRating] = useState(null);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating == null) return;
    setSending(true);
    const type = rating === 'up' ? 'good' : 'bad';
    const payload = { type, message: message.trim() || undefined, context: 'general' };
    try {
      const res = await fetch(`${API}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Feedback request failed');
    } catch (_) {
      saveItem({ rating, message: message.trim() || undefined });
    } finally {
      setSending(false);
      setSubmitted(true);
      setRating(null);
      setMessage('');
    }
  };

  if (submitted) {
    return (
      <section className="feedback-section" aria-live="polite">
        <div className="feedback-thanks-box">
          <p className="feedback-thanks">Thanks for your feedback. It helps us improve.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="feedback-section">
      <div className="feedback-line" />
      <h2 className="feedback-heading">How was that?</h2>
      <p className="feedback-hint">We’re just getting started. Your feedback helps.</p>
      <form className="feedback-form" onSubmit={handleSubmit}>
        <div className="feedback-vote">
          <button
            type="button"
            className={`feedback-btn up ${rating === 'up' ? 'active' : ''}`}
            onClick={() => setRating('up')}
            aria-pressed={rating === 'up'}
            aria-label="Good"
          >
            👍
          </button>
          <button
            type="button"
            className={`feedback-btn down ${rating === 'down' ? 'active' : ''}`}
            onClick={() => setRating('down')}
            aria-pressed={rating === 'down'}
            aria-label="Could be better"
          >
            👎
          </button>
        </div>
        <label className="feedback-message-label" htmlFor="feedback-message">
          Anything to add? (optional)
        </label>
        <textarea
          id="feedback-message"
          className="feedback-message-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What worked, what didn’t…"
          rows={2}
        />
        <button type="submit" className="btn btn-ghost btn-feedback-submit" disabled={rating == null || sending}>
          {sending ? 'Sending…' : 'Send feedback'}
        </button>
      </form>
    </section>
  );
}
