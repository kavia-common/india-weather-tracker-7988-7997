import { useEffect } from 'react';
import { getSupabaseClient } from '../supabaseClient';

export default function AuthCallback() {
  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      try {
        // For supabase-js v2, getSessionFromUrl was removed in favor of exchangeCodeForSession.
        // If your auth uses PKCE (default), the library will handle it via exchangeCodeForSession.
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          console.error('Auth callback error:', error);
          // You can redirect to an error route if you add routing
        } else if (data?.session) {
          // Redirect to dashboard/intended page if you add routing
          // e.g., navigate('/dashboard')
        }
      } catch (e) {
        console.error('Auth callback exception:', e);
      }
    };
    handleAuthCallback();
  }, []);

  return <div>Processing authentication...</div>;
}
