import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getSupabaseClient } from '../supabaseClient';

/**
 * PUBLIC_INTERFACE
 * AuthContextShape
 * Shape of the authentication context exposed to consumers.
 */
const AuthContext = createContext({
  user: null,
  setUser: () => {},
  authLoading: true,
  // Provide a safe default ref-like object to prevent consumers from crashing
  __logoutInProgressRef: { current: false },
});

/**
 * PUBLIC_INTERFACE
 * useAuth
 * Hook to access the authentication context.
 */
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * PUBLIC_INTERFACE
 * AuthProvider
 * React provider that:
 * - Initializes auth state from Supabase (if configured)
 * - Subscribes to onAuthStateChange to keep user in sync
 * - Exposes user, setUser, and authLoading to consumers
 * - Ensures logout UX can clear UI instantly by allowing consumers to setUser(null) before any async call
 */
export function AuthProvider({ children }) {
  const supabase = getSupabaseClient();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const unsubscribeRef = useRef(() => {});
  const logoutInProgressRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      // When Supabase is not configured, treat as logged out but don't crash.
      if (!supabase) {
        if (mounted) {
          setUser(null);
          setAuthLoading(false);
        }
        return;
      }
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;
        setUser(session?.user ?? null);
      } catch {
        if (!mounted) return;
        setUser(null);
      } finally {
        if (mounted) setAuthLoading(false);
      }

      // Subscribe to Supabase auth changes and update only the context
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;
        // If a manual logout flow has already cleared UI, ignore late events during the brief window
        if (logoutInProgressRef.current && (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED')) {
          return;
        }
        setUser(session?.user ?? null);
        setAuthLoading(false);
      });

      unsubscribeRef.current =
        data?.subscription?.unsubscribe?.bind(data.subscription) || (() => {});
    }

    init();

    return () => {
      mounted = false;
      try {
        unsubscribeRef.current?.();
      } catch {
        // ignore
      }
    };
  }, [supabase]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      authLoading,
      // expose the ref so consumers (like Header) can mark logout in progress to avoid late event flicker
      __logoutInProgressRef: logoutInProgressRef,
    }),
    [user, authLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
