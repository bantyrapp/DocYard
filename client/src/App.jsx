import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Pricing } from './pages/Pricing';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { Admin } from './pages/Admin';
import { Download } from './pages/Download';
import { Documents } from './pages/Documents';
import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="signup" element={null} />
          <Route path="onboarding" element={null} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="terms" element={<Terms />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="admin" element={<Admin />} />
          <Route path="documents" element={<Documents />} />
          <Route path="download" element={<Download />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
