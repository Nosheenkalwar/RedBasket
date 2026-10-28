import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { api, tokens } from '../lib/api';
import type { Customer } from '../lib/types';

type AuthMode = 'login' | 'signup' | null;
type Ctx = {
  customer: Customer | null;
  ready: boolean;
  signIn: (token: string, customer: Customer) => void;
  signOut: () => void;
  setCustomer: (c: Customer) => void;
  authMode: AuthMode;
  openAuth: (mode: AuthMode) => void;
};

const AuthCtx = createContext<Ctx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ready, setReady] = useState(false);
  const [authMode, openAuth] = useState<AuthMode>(null);

  // keep the customer logged in after a refresh while the token is still valid
  useEffect(() => {
    if (!tokens.get('customer')) return setReady(true);
    api<Customer>('/me').then(setCustomer).catch(() => tokens.clear('customer')).finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const onExpired = (e: Event) => (e as CustomEvent).detail === 'customer' && setCustomer(null);
    window.addEventListener('rb:logout', onExpired);
    return () => window.removeEventListener('rb:logout', onExpired);
  }, []);

  const signIn = (token: string, c: Customer) => {
    tokens.set('customer', token);
    setCustomer(c);
  };
  const signOut = () => {
    tokens.clear('customer');
    setCustomer(null);
  };

  return <AuthCtx.Provider value={{ customer, ready, signIn, signOut, setCustomer, authMode, openAuth }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
