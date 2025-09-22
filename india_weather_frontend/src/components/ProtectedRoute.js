import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getSupabaseClient } from '../supabaseClient';

/**
 * PUBLIC_INTERFACE
 * ProtectedRoute
 * Wraps a route element and ensures only authenticated users can access it.
 * Redirects to /login with a redirect parameter if user is not authenticated.
 *
 * Fixes:
 * - Ensure we always clear "loading" on auth state changes so the UI doesn't get stuck on "Checking authentication..."
 * - Add a small safety timeout to avoid indefinite loading in edge cases where no auth event arrives.
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
        if (mounted) setLoading(false);
      }, 4000);

      if (!supabase) {
        if (mounted) {
          setSessionUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;
        setSessionUser(session?.user ?? null);
        setLoading(false);
      } catch (_e) {
        if (mounted) {
          setSessionUser(null);
          setLoading(false);
        }
      }
    }

    fetchSession();

    let unsubscribe = () => {};
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        // Update user and explicitly clear loading when we get any auth event.
        setSessionUser(session?.user ?? null);
        setLoading(false);
      });
      // Supabase v2 returns { data: { subscription } }
      unsubscribe = data?.subscription?.unsubscribe?.bind(data.subscription) || (() => {});
    }

    return () => {
      mounted = false;
      if (safetyTimer) window.clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, [supabase]);

  if (loading) {
    return <div style={{ padding: 20 }}>Checking authentication...</div>;
  }

  if (!sessionUser) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectTo}`} replace />;
  }

  return children;
}
