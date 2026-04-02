import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const API = '/api';

export function Pricing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/stripe/create-checkout-session`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not start checkout');
      if (data.url) window.location.href = data.url;
      else throw new Error('No checkout URL');
    } catch (e) {
      setError(e.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="page pricing-page">
      <div className="page-inner pricing-inner">
        <p className="pricing-tagline">Property accounting</p>
        <h1 className="pricing-heading">One plan. One price.</h1>
        <p className="pricing-try-free">Free while billing is wired up.</p>

        <div className="pricing-card-single">
          <div className="pricing-card-line" />
          <p className="pricing-plan-name">EazyBookz</p>
          <p className="pricing-price">
            <span className="pricing-amount">$10</span>
            <span className="pricing-period">/month</span>
          </p>
          <ul className="pricing-features">
            <li>Trial balance → Yardi JE</li>
            <li>Works locally in the browser</li>
            <li>Excel templates</li>
            <li>Cancel anytime</li>
          </ul>
          <button
            type="button"
            className="btn btn-primary btn-pricing"
            onClick={handleSubscribe}
            disabled={!!loading}
          >
            {loading ? 'Opening checkout…' : 'Subscribe (when live)'}
          </button>
        </div>

        {error && <p className="error-msg pricing-error" role="alert">{error}</p>}
        <p className="pricing-note">Checkout isn’t live yet—the app stays free to use.</p>

        <p className="pricing-legal">By subscribing you agree to our <Link to="/terms">Terms of Service</Link>.</p>
        <p className="pricing-back">
          <Link to="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
