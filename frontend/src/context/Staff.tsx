import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { staffApi, tokens } from '../lib/api';
import type { StaffUser } from '../lib/types';

const IDLE_LIMIT = 30 * 60 * 1000; // REQ-SL-8

type Ctx = { staff: StaffUser | null; ready: boolean; signIn: (t: string, s: StaffUser) => void; signOut: () => void; setStaff: (s: StaffUser) => void };
const StaffCtx = createContext<Ctx>(null!);

export function StaffProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!tokens.get('staff')) return setReady(true);
    staffApi<StaffUser>('/staff-auth/me').then(setStaff).catch(() => tokens.clear('staff')).finally(() => setReady(true));
    const onExpired = (e: Event) => (e as CustomEvent).detail === 'staff' && setStaff(null);
    window.addEventListener('rb:logout', onExpired);
    return () => window.removeEventListener('rb:logout', onExpired);
  }, []);

  const signOut = () => {
    staffApi('/staff-auth/logout', { method: 'POST' }).catch(() => {});
    tokens.clear('staff');
    setStaff(null);
  };

  // log out after 30 minutes without any click or key press
  useEffect(() => {
    if (!staff) return;
    let timer = setTimeout(signOut, IDLE_LIMIT);
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(signOut, IDLE_LIMIT);
    };
    window.addEventListener('click', reset);
    window.addEventListener('keydown', reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', reset);
      window.removeEventListener('keydown', reset);
    };
  }, [staff]);

  const signIn = (token: string, s: StaffUser) => {
    tokens.set('staff', token);
    setStaff(s);
  };

  return <StaffCtx.Provider value={{ staff, ready, signIn, signOut, setStaff }}>{children}</StaffCtx.Provider>;
}

export const useStaff = () => useContext(StaffCtx);
