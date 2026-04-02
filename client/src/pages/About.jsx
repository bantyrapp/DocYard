import React from 'react';
import { Link } from 'react-router-dom';

export function About() {
  return (
    <div className="page about-page">
      <div className="page-inner about-inner">
        <h1 className="page-title">About EazyBookz</h1>
        <p className="about-lead">
          EazyBookz is a project built by <strong>Austin Duffy</strong>, shaped around how real estate property
          accounting teams actually close the books—accurately, on deadline, and with systems that already live in the
          workflow.
        </p>

        <section className="terms-section about-section">
          <h2>Background &amp; expertise</h2>
          <p>
            Austin’s background is in <strong>real estate property accounting</strong>: commercial and multifamily
            portfolios, full month-end close, financial reporting, reconciliations, variance analysis, and day-to-day
            collaboration with property managers, controllers, and leadership. That work demands precision on
            trial balances, chart-of-accounts structure, and journal timing—especially when multiple properties and
            periods are in play at once.
          </p>
          <p>
            He is experienced with <strong>Yardi</strong> in a property accounting context and with building rigorous
            Excel-based processes to support reporting quality and control. EazyBookz reflects that discipline: a
            focused path from source trial balance (or balance sheet) data to an import-ready journal entry file,
            with review in the app before anything is finalized.
          </p>
        </section>

        <section className="terms-section about-section">
          <h2>What is Yardi?</h2>
          <p>
            <strong>Yardi Voyager</strong> (often referred to simply as Yardi) is a widely used{' '}
            <strong>property management and accounting platform</strong> for real estate. Owners and managers rely on it
            for operations, the general ledger, payables and receivables, and consolidated reporting across assets.
          </p>
          <p>
            Journal entries are a core part of month-end: adjusting activity, aligning the GL with supporting
            schedules, and closing each period cleanly. Many teams import entries using{' '}
            <strong>Yardi-defined templates or formats</strong> rather than keying every line by hand—when those
            templates are wrong or the source data is messy, rework and delays stack up quickly.
          </p>
          <p className="about-disclaimer">
            EazyBookz is not affiliated with, endorsed by, or sponsored by Yardi Systems, Inc. Yardi® is a registered
            trademark of Yardi Systems, Inc.
          </p>
        </section>

        <section className="terms-section about-section">
          <h2>Why journal entry prep takes so long</h2>
          <p>
            Turning a trial balance or balance sheet export into a <strong>correct, balanced journal entry file</strong>{' '}
            is rarely a single click. Accountants routinely spend time mapping accounts, checking debits and credits,
            setting post month and journal dates, splitting or combining lines for property reporting, and validating
            against internal controls—often under month-end pressure and across many files when periods are rolled
            forward together.
          </p>
          <p>
            EazyBookz is designed to <strong>automate the repetitive formatting and structure</strong> of that path
            while keeping the accountant in control of the result—so the output is compatible with a typical Yardi
            journal import workflow, without replacing professional judgment or your own review process.
          </p>
        </section>

        <blockquote className="about-quote">
          <p>
            “I was spending hours doing this and realized there needs to be something for this.”
          </p>
          <footer>— Austin Duffy</footer>
        </blockquote>

        <p className="terms-back">
          <Link to="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
