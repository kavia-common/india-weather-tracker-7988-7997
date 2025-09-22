import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../supabaseClient';

/**
 * PUBLIC_INTERFACE
 * AuthCallback
 * Handles Supabase auth callback (PKCE) and redirects user to intended route.
 * Query support:
 * - redirect: the path to navigate after successful auth (url-encoded)
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const handleAuthCallback = async () => {
      const supabase = getSupabaseClient();
      // Determine redirect target from query string (default to /search if available, else /)
      const params = new URLSearchParams(location.search);
      const redirectParam = params.get('redirect');
      const redirectTo = redirectParam || '/search';

      if (!supabase) {
        // If Supabase is not configured, return user to login
        navigate('/login', { replace: true });
        return;
      }

      try {
        // For supabase-js v2, exchangeCodeForSession processes the code in the URL and sets the session.
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (!mounted) return;

        if (error) {
          console.error('Auth callback error:', error);
          navigate('/login', { replace: true });
          return;
        }

        if (data?.session) {
          // Navigate to redirect target or fallback
          navigate(redirectTo, { replace: true });
          return;
        }

        // If no data/session returned, go to login
        navigate('/login', { replace: true });
      } catch (e) {
        console.error('Auth callback exception:', e);
        navigate('/login', { replace: true });
      }
    };

    handleAuthCallback();
    return () => {
      mounted = false;
    };
  }, [location.search, navigate]);

  return <div aria-busy="true" aria-live="polite">Processing authentication...</div>;
}
