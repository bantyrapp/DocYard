import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconChart, IconSparkle, IconLock, IconBuilding } from './icons/SlideIcons';

const SLIDES = [
  {
    title: 'Trial balance → journal entry',
    body: 'Upload Excel, set period and date, download a Yardi-ready file. Runs in your browser—no upload.',
    Icon: IconChart,
  },
  {
    title: 'When you sign up',
    body: 'Save preferences, sync across devices, and get product updates. Start free.',
    Icon: IconSparkle,
  },
  {
    title: 'When you sign in',
    body: 'Remembers your defaults and keeps the same experience on web and desktop.',
    Icon: IconLock,
  },
  {
    title: 'Built for property accounting',
    body: 'Excel in, Excel out. Balanced debits and credits. Independent—not affiliated with Yardi or others.',
    Icon: IconBuilding,
  },
];

export function WelcomeSlides({ onSignIn }) {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const slide = SLIDES[index];
  const Icon = slide.Icon;

  return (
    <div className="welcome-slides">
      <div className="welcome-slides-inner">
        <div className="welcome-slide" key={index}>
          <span className="welcome-slide-icon" aria-hidden>
            <Icon />
          </span>
          <h2 className="welcome-slide-title">{slide.title}</h2>
          <p className="welcome-slide-body">{slide.body}</p>
        </div>

        <div className="welcome-dots" role="tablist" aria-label="Slides">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Slide ${i + 1}`}
              className={`welcome-dot ${i === index ? 'active' : ''}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>

        <div className="welcome-nav">
          <button
            type="button"
            className="btn btn-ghost welcome-prev"
            onClick={() => setIndex((i) => (i === 0 ? SLIDES.length - 1 : i - 1))}
            aria-label="Previous slide"
          >
            ← Prev
          </button>
          <button
            type="button"
            className="btn btn-ghost welcome-next"
            onClick={() => setIndex((i) => (i === SLIDES.length - 1 ? 0 : i + 1))}
            aria-label="Next slide"
          >
            Next →
          </button>
        </div>

        <p className="welcome-cta-hint">Sign in or create an account to continue.</p>
        <div className="welcome-cta-buttons">
          <button type="button" className="btn btn-primary welcome-signin" onClick={() => { onSignIn(); }}>
            Sign in (dev)
          </button>
          <button type="button" className="btn btn-ghost welcome-create" onClick={() => navigate('/signup')}>
            Create account
          </button>
        </div>
      </div>
    </div>
  );
}
