import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ONBOARDING_STEPS = [
  { id: 'info', title: 'Your information', subtitle: 'Confirm your details' },
  { id: 'preferences', title: 'Preferences', subtitle: 'How you like to work' },
  { id: 'paywall', title: 'Choose your plan', subtitle: 'Start free; upgrade later if you want Pro' },
  { id: 'completed', title: "You're all set", subtitle: 'Jump into EazyBookz' },
];

export function Onboarding({ user, onComplete }) {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [prefs, setPrefs] = useState({ defaultPostMonth: 'last', theme: 'dark', notifications: false });
  const step = ONBOARDING_STEPS[stepIndex];
  const isLast = stepIndex === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
      navigate('/');
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  return (
    <div className="page onboarding-page">
      <div className="page-inner onboarding-inner">
        <div className="onboarding-progress">
          <span className="onboarding-step-label">Step {stepIndex + 1} of {ONBOARDING_STEPS.length}</span>
          <div className="onboarding-progress-bar">
            <div className="onboarding-progress-fill" style={{ width: `${((stepIndex + 1) / ONBOARDING_STEPS.length) * 100}%` }} />
          </div>
        </div>

        <h1 className="onboarding-title">{step.title}</h1>
        <p className="onboarding-subtitle">{step.subtitle}</p>

        {step.id === 'info' && user && (
          <div className="onboarding-info-card">
            <p><strong>Email</strong> {user.email || '—'}</p>
            <p><strong>Phone</strong> {user.phone || '—'}</p>
            {user.via === 'gmail' && <p className="onboarding-badge">Signed up with Gmail</p>}
          </div>
        )}

        {step.id === 'preferences' && (
          <div className="onboarding-preferences">
            <div className="input-group">
              <label>Default post month</label>
              <select
                value={prefs.defaultPostMonth}
                onChange={(e) => setPrefs((p) => ({ ...p, defaultPostMonth: e.target.value }))}
                className="onboarding-select"
              >
                <option value="last">Last month</option>
                <option value="current">Current month</option>
              </select>
            </div>
            <div className="input-group">
              <label>Theme</label>
              <select
                value={prefs.theme}
                onChange={(e) => setPrefs((p) => ({ ...p, theme: e.target.value }))}
                className="onboarding-select"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
            <label className="onboarding-check">
              <input
                type="checkbox"
                checked={prefs.notifications}
                onChange={(e) => setPrefs((p) => ({ ...p, notifications: e.target.checked }))}
              />
              <span>Email me product updates</span>
            </label>
          </div>
        )}

        {step.id === 'paywall' && (
          <div className="onboarding-paywall">
            <div className="onboarding-plan-card">
              <p className="onboarding-plan-name">Free</p>
              <p className="onboarding-plan-price">$0</p>
              <p className="onboarding-plan-desc">Core export flow, local processing, templates.</p>
            </div>
            <div className="onboarding-plan-card featured">
              <p className="onboarding-plan-name">Pro</p>
              <p className="onboarding-plan-price">$10/mo</p>
              <p className="onboarding-plan-desc">Everything in Free, plus priority support—coming soon.</p>
            </div>
            <p className="onboarding-paywall-note">Pick Free now; you can upgrade anytime.</p>
          </div>
        )}

        {step.id === 'completed' && (
          <p className="onboarding-completed-text">You’re ready—tap Get started for the home screen.</p>
        )}

        <button type="button" className="btn btn-primary onboarding-next" onClick={handleNext}>
          {isLast ? 'Get started' : 'Next'}
        </button>
      </div>
    </div>
  );
}
