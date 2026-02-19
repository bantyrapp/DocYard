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
          <p>DocYard (“we,” “our”) provides trial balance and balance sheet to Yardi journal entry conversion (single file or multi-month). This policy describes how we handle your information.</p>
        </section>

        <section className="terms-section">
          <h2>2. Data processed in your browser</h2>
          <p>When you use the main conversion flow (upload Excel and download the result), your file is processed entirely in your browser. We do not receive, store, or transmit the contents of your file for that flow. Your data never leaves your device unless you choose to use features that send data to our servers (e.g. optional cloud sync or support).</p>
        </section>

        <section className="terms-section">
          <h2>3. Information we collect</h2>
          <p>We may collect: (a) account information you provide (email, name) when you sign up; (b) usage and analytics data (e.g. pages visited, errors) to improve the service; (c) payment information processed by Stripe (we do not store full card details). We do not sell your personal information.</p>
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
          <p>For privacy questions or requests, use the contact information provided on the DocYard website.</p>
        </section>

        <p className="terms-back">
          <Link to="/">← Back to DocYard</Link>
        </p>
      </div>
    </div>
  );
}
