import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AdminAuthState {
  session: Session | null;
  isAdmin: boolean;
  /** True while the initial session/admin check is still in flight. */
  loading: boolean;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthState | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function checkAdmin(currentSession: Session | null) {
    if (!currentSession) {
      setIsAdmin(false);
      return;
    }
    // is_admin() is a SECURITY DEFINER function that checks the
    // caller's auth.uid() against the admin_users allowlist table.
    const { data, error } = await supabase.rpc('is_admin');
    setIsAdmin(!error && data === true);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      checkAdmin(s).finally(() => setLoading(false));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // Deliberately don't call setLoading(true) here. This listener also
      // fires for background events like TOKEN_REFRESHED whenever the tab
      // regains focus — flipping loading back to true would unmount the
      // whole admin page (AdminLayout renders a full-screen "Loading..."
      // in place of children while loading), wiping out any in-progress
      // form input. Only the very first session check above should show
      // the loading screen.
      checkAdmin(s);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AdminAuthContext.Provider value={{ session, isAdmin, loading, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
