import React from 'react';
import { Link } from 'react-router-dom';

export function Privacy() {
  return (
    <div className="page privacy-page">
      <div className="page-inner">
        <h1 className="page-title">Privacy Policy</h1>
        <p className="page-updated">Last updated: February 2025</p>

        <section className="terms-section">
          <h2>1. Who we are</h2>
          <p>EazyBookz (“we,” “our”) offers trial balance and balance sheet → Yardi JE conversion. This policy explains how we handle information.</p>
        </section>

        <section className="terms-section">
          <h2>2. Data processed in your browser</h2>
          <p>For the main upload → download flow, processing stays in your browser—we don’t receive your file contents. Data leaves your device only if you use features that explicitly call our servers (e.g. account, payments, support).</p>
        </section>

        <section className="terms-section">
          <h2>3. Information we collect</h2>
          <p>We may collect account details you give us, usage/analytics to improve the product, and payment data via Stripe (we don’t store full card numbers). We don’t sell personal information.</p>
        </section>

        <section className="terms-section">
          <h2>4. Security</h2>
          <p>We use industry-standard practices to protect data in transit and at rest. Access to data is limited to those who need it to operate and support the service.</p>
        </section>

        <section className="terms-section">
          <h2>5. Your rights</h2>
          <p>You may request access, correction, or deletion of your personal data by contacting us. If you are in the EU/EEA or UK, you have additional rights under applicable privacy laws.</p>
        </section>

        <section className="terms-section">
          <h2>6. Contact</h2>
          <p>Privacy questions: use the contact on this site.</p>
        </section>

        <p className="terms-back">
          <Link to="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
