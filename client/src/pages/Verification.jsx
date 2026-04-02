import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

export function Verification({ onVerify }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'gmail' | 'phone' | 'done'

  const handleContinueWithEmail = (e) => {
    e.preventDefault();
    if (email.trim()) {
      onVerify({ email: email.trim(), phone: phone.trim() });
      navigate('/onboarding');
    }
  };

  const handleContinueWithGmail = () => {
    onVerify({ email: 'user@gmail.com', phone: phone.trim(), via: 'gmail' });
    navigate('/onboarding');
  };

  const handleContinueWithPhone = (e) => {
    e.preventDefault();
    if (phone.trim()) {
      onVerify({ email: email.trim() || undefined, phone: phone.trim() });
      navigate('/onboarding');
    }
  };

  return (
    <div className="page verification-page">
      <div className="page-inner verification-inner">
        <h1 className="page-title">Create account</h1>
        <p className="verification-intro">Sign up with email, Gmail, or phone.</p>

        <form className="verification-form" onSubmit={handleContinueWithEmail}>
          <div className="input-group">
            <label htmlFor="verification-email">Email</label>
            <input
              id="verification-email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="verification-input"
              autoComplete="email"
            />
          </div>

          <div className="verification-divider">
            <span>or</span>
          </div>

          <button type="button" className="btn btn-ghost verification-gmail" onClick={handleContinueWithGmail}>
            <span className="verification-gmail-icon" aria-hidden>G</span>
            Continue with Gmail
          </button>

          <div className="verification-divider">
            <span>or</span>
          </div>

          <div className="input-group">
            <label htmlFor="verification-phone">Phone</label>
            <input
              id="verification-phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="verification-input"
              autoComplete="tel"
            />
          </div>

          <button type="submit" className="btn btn-primary verification-submit" disabled={!email.trim() && !phone.trim()}>
            Verify and continue
          </button>
        </form>

        <p className="verification-back">
          <Link to="/">← Back to welcome</Link>
        </p>
      </div>
    </div>
  );
}
