import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getSupabaseClient } from '../supabaseClient';

/**
 * PUBLIC_INTERFACE
 * ProtectedRoute
 * Wraps a route element and ensures only authenticated users can access it.
 * Redirects to /login with a redirect parameter if user is not authenticated.
 *
 * Enhancements:
 * - Robust logging around session fetch and auth state changes to debug stuck states.
 * - Safety timeout ensures we never hang indefinitely on "Checking authentication...".
 */
export default function ProtectedRoute({ children }) {
  const supabase = getSupabaseClient();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    let safetyTimer;

    async function fetchSession() {
      // Safety timer to prevent indefinite "checking..." in edge cases
      safetyTimer = window.setTimeout(() => {
        if (mounted) {
          console.debug('[ProtectedRoute] Safety timer fired: clearing loading');
          setLoading(false);
        }
      }, 4000);

      if (!supabase) {
        if (mounted) {
          console.debug('[ProtectedRoute] Supabase client unavailable; treating as unauthenticated');
          setSessionUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        console.debug('[ProtectedRoute] Fetching current session...');
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;
        console.debug('[ProtectedRoute] getSession result:', !!session, session?.user?.email);
        setSessionUser(session?.user ?? null);
        setLoading(false);
      } catch (err) {
        console.warn('[ProtectedRoute] getSession error:', err);
        if (mounted) {
          setSessionUser(null);
          setLoading(false);
        }
      }
    }

    fetchSession();

    // Subscribe to auth state changes to keep session in sync
    let unsubscribe = () => {};
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;
        console.debug('[ProtectedRoute] onAuthStateChange event:', event, 'user:', !!session?.user);
        setSessionUser(session?.user ?? null);
        setLoading(false);
      });
      // Supabase v2 returns { data: { subscription } }
      unsubscribe = data?.subscription?.unsubscribe?.bind(data.subscription) || (() => {});
    }

    return () => {
      mounted = false;
      if (safetyTimer) window.clearTimeout(safetyTimer);
      try {
        unsubscribe();
      } catch (e) {
        // ignore
      }
    };
  }, [supabase]);

  if (loading) {
    return <div style={{ padding: 20 }}>Checking authentication...</div>;
  }

  if (!sessionUser) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    console.debug('[ProtectedRoute] No session found; redirecting to login with redirect:', redirectTo);
    return <Navigate to={`/login?redirect=${redirectTo}`} replace />;
  }

  return children;
}
