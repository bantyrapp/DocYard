import React from 'react';
import { Link } from 'react-router-dom';

export function Terms() {
  return (
    <div className="page terms-page">
      <div className="page-inner">
        <h1 className="page-title">Terms of Service</h1>
        <p className="page-updated">Last updated: February 2025</p>

        <section className="terms-section">
          <h2>1. Agreement</h2>
          <p>By using DocYard (“Service”), you agree to these Terms of Service. If you do not agree, do not use the Service.</p>
        </section>

        <section className="terms-section">
          <h2>2. Description of Service</h2>
          <p>DocYard converts trial balance and balance sheet Excel files into Yardi-format journal entry imports—single month or full year. The Service is for real estate and property accounting. DocYard is not affiliated with, endorsed by, or connected to Yardi or any other property management software.</p>
        </section>

        <section className="terms-section">
          <h2>3. Account and Payment</h2>
          <p>Paid plans require a subscription. You will be charged the stated fee (e.g. monthly) until you cancel. Payments are processed by Stripe. Refunds are at our discretion and in line with our refund policy.</p>
        </section>

        <section className="terms-section">
          <h2>4. Acceptable Use</h2>
          <p>You may not use the Service for any illegal purpose or to violate any applicable law. You may not attempt to gain unauthorized access to the Service or any data. You are responsible for the data you upload and for ensuring you have the right to use it.</p>
        </section>

        <section className="terms-section">
          <h2>5. Data and Privacy</h2>
          <p>We process your uploaded files to provide the Service. We do not sell your data. Our <Link to="/privacy">Privacy Policy</Link> describes how we collect and use information.</p>
        </section>

        <section className="terms-section">
          <h2>6. Disclaimer</h2>
          <p>The Service is provided “as is.” We do not guarantee accuracy of converted data or fitness for a particular purpose. You are responsible for verifying journal entries before importing into any system.</p>
        </section>

        <section className="terms-section">
          <h2>7. Limitation of Liability</h2>
          <p>To the fullest extent permitted by law, DocYard and its providers shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>
        </section>

        <section className="terms-section">
          <h2>8. Changes</h2>
          <p>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance. Material changes may be communicated by email or a notice in the Service.</p>
        </section>

        <section className="terms-section">
          <h2>9. Termination</h2>
          <p>We may suspend or terminate your access if you breach these Terms. You may cancel your subscription at any time through your account or payment provider.</p>
        </section>

        <section className="terms-section">
          <h2>10. Contact</h2>
          <p>Questions about these Terms may be sent to the contact address provided on the DocYard website.</p>
        </section>

        <p className="terms-back">
          <Link to="/">← Back to DocYard</Link>
        </p>
      </div>
    </div>
  );
}
