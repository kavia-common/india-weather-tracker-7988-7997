import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getSupabaseClient } from '../supabaseClient';

/**
 * PUBLIC_INTERFACE
 * ProtectedRoute
 * Wraps a route element and ensures only authenticated users can access it.
 * Redirects to /login with a redirect parameter if user is not authenticated.
 */
export default function ProtectedRoute({ children }) {
  const supabase = getSupabaseClient();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchSession() {
      if (!supabase) {
        if (mounted) {
          setSessionUser(null);
          setLoading(false);
        }
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (mounted) {
        setSessionUser(session?.user ?? null);
        setLoading(false);
      }
    }

    fetchSession();

    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) {
          setSessionUser(session?.user ?? null);
        }
      });

      return () => {
        mounted = false;
        authListener?.subscription?.unsubscribe?.();
      };
    }

    return () => {
      mounted = false;
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
