import React, { createContext, useContext, useState, useCallback } from 'react';

const AUTH_KEY = 'docyard-signed-in';
const ONBOARDING_KEY = 'docyard-onboarding-complete';
const USER_KEY = 'docyard-user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [signedIn, setSignedIn] = useState(() => localStorage.getItem(AUTH_KEY) === 'true');
  const [onboardingComplete, setOnboardingComplete] = useState(() => localStorage.getItem(ONBOARDING_KEY) === 'true');
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem(USER_KEY);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const signInDev = useCallback(() => {
    setSignedIn(true);
    setOnboardingComplete(true);
    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem(ONBOARDING_KEY, 'true');
  }, []);

  const signOut = useCallback(() => {
    setSignedIn(false);
    setOnboardingComplete(false);
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const onVerify = useCallback((userData) => {
    setUser(userData);
    setSignedIn(true);
    setOnboardingComplete(false);
    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    localStorage.removeItem(ONBOARDING_KEY);
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboardingComplete(true);
    localStorage.setItem(ONBOARDING_KEY, 'true');
  }, []);

  const value = {
    signedIn,
    onboardingComplete,
    user,
    signInDev,
    signOut,
    onVerify,
    completeOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
