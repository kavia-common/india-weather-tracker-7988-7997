import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../supabaseClient';

/**
 * PUBLIC_INTERFACE
 * Header
 * Branded header that shows navigation, auth state (user email),
 * and Login/Logout controls. Uses Ocean Professional theme styling via App.css.
 *
 * Logout UX and profiling:
 * - Instrument durations around signOut to profile slowness.
 * - Provide two strategies (toggle via localStorage key 'logoutStrategy'):
 *     1) awaitBeforeNav: await supabase.auth.signOut() then navigate.
 *     2) fireAndNavigate (default): Optimistically clear UI and navigate immediately,
 *        run signOut in background; never block redirect on errors.
 * - Surface rare errors via console warning and a transient console-based "toast".
 */
export default function Header() {
  const supabase = getSupabaseClient();
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null); // simple ephemeral toast state
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Helper: get current strategy from localStorage so we can A/B test easily during profiling.
  const logoutStrategy = useMemo(() => {
    // 'awaitBeforeNav' | 'fireAndNavigate'
    const value = (typeof window !== 'undefined' && window.localStorage.getItem('logoutStrategy')) || 'fireAndNavigate';
    return value === 'awaitBeforeNav' ? 'awaitBeforeNav' : 'fireAndNavigate';
  }, []);

  // Helper: show ephemeral toast (console + optional in-UI badge)
  const showToast = (message) => {
    try {
      console.warn('[Header][Toast]', message);
    } catch {
      // ignore
    }
    setToast(String(message));
    // Auto-clear after 2.5s
    window.setTimeout(() => {
      if (mountedRef.current) setToast(null);
    }, 2500);
  };

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      if (!supabase) return;
      try {
        const t0 = performance.now();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const dt = performance.now() - t0;
        console.debug('[Header] getSession duration(ms):', Math.round(dt), 'session?', !!session);
        if (mounted) setUser(session?.user ?? null);
      } catch (e) {
        // If session fetch fails, treat as logged out
        if (mounted) setUser(null);
        console.warn('[Header] getSession error:', e);
      }
    }
    getSession();

    if (supabase) {
      const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
        console.debug('[Header] onAuthStateChange:', event, 'user?', !!session?.user);
        // Keep local user in sync with Supabase auth state
        setUser(session?.user ?? null);
      });
      return () => {
        subscription?.subscription?.unsubscribe?.();
        mounted = false;
      };
    }
  }, [supabase]);

  // PUBLIC_INTERFACE
  const handleLogout = async () => {
    const tStart = performance.now();
    const navToLogin = () => {
      // Ensure we redirect immediately for a snappy UX
      navigate('/login', { replace: true });
    };

    if (!supabase) {
      console.debug('[Header] No Supabase client; fast-redirecting to login.');
      navToLogin();
      return;
    }

    // Clear UI state right away for instantaneous feedback
    setUser(null);

    if (logoutStrategy === 'awaitBeforeNav') {
      // Strategy 1: await signOut then navigate (baseline for profiling)
      try {
        console.debug('[Header][Strategy=awaitBeforeNav] Starting signOut...');
        const t0 = performance.now();
        const { error } = await supabase.auth.signOut();
        const dur = performance.now() - t0;
        console.debug('[Header][Strategy=awaitBeforeNav] signOut duration(ms):', Math.round(dur));
        if (error) {
          console.warn('[Header] signOut error:', error);
          showToast('Logout completed locally; server sign-out may be delayed.');
        }
      } catch (e) {
        console.warn('[Header] signOut exception:', e);
        showToast('Logout completed locally; sign-out encountered a network error.');
      } finally {
        const total = performance.now() - tStart;
        console.debug('[Header] Total logout flow duration(ms) including navigation:', Math.round(total));
        navToLogin();
      }
      return;
    }

    // Strategy 2 (default): navigate first, perform signOut in background (never block)
    try {
      console.debug('[Header][Strategy=fireAndNavigate] Navigating immediately, signOut in background...');
      // Navigate right away
      navToLogin();

      // Kick off signOut in the background; we do not await before navigation.
      // Add a hard timeout guard so we can profile "hung" calls.
      const signOutPromise = (async () => {
        const t0 = performance.now();
        const { error } = await supabase.auth.signOut();
        const dur = performance.now() - t0;
        console.debug('[Header][Strategy=fireAndNavigate] signOut duration(ms):', Math.round(dur));
        if (error) {
          console.warn('[Header] signOut error:', error);
          showToast('Signed out. Server session cleanup had a minor issue.');
        }
      })();

      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 5000));
      // Race just to log if it seems slow; not to block UI.
      Promise.race([signOutPromise, timeoutPromise]).then((result) => {
        if (result === undefined) {
          // signOutPromise might still be pending; we log if timeout fired first
          console.debug('[Header] signOut taking over 5s (non-blocking).');
        }
      });
    } catch (e) {
      console.warn('[Header] Background signOut exception:', e);
      showToast('Signed out. Background cleanup hit an error.');
      // Navigation already initiated
    } finally {
      const total = performance.now() - tStart;
      console.debug('[Header] Logout initiated; total time to trigger navigation(ms):', Math.round(total));
    }
  };

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
          <div className="brand-badge">IW</div>
          <div>
            <div className="brand-title">India Weather</div>
            <div className="brand-sub">Ocean Professional</div>
          </div>
        </Link>

        <nav style={{ marginLeft: '24px', display: 'flex', gap: 12 }}>
          <NavLink
            to="/"
            style={({ isActive }) => ({
              fontWeight: 700,
              color: isActive ? 'var(--primary)' : 'inherit',
              textDecoration: 'none',
            })}
          >
            Home
          </NavLink>
          {/* Only show Search when authenticated to clearly hide restricted feature on logout */}
          {user && (
            <NavLink
              to="/search"
              style={({ isActive }) => ({
                fontWeight: 700,
                color: isActive ? 'var(--primary)' : 'inherit',
                textDecoration: 'none',
              })}
            >
              Search
            </NavLink>
          )}
        </nav>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge">Real-time</span>
          {user ? (
            <>
              <span
                className="location-pill"
                title={user.email || 'Authenticated user'}
                style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}
              >
                {user.email}
              </span>
              <button
                className="btn btn-ghost"
                onClick={handleLogout}
                title="Logout"
                aria-label="Logout"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost" title="Login" style={{ textDecoration: 'none' }}>
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary" title="Sign up" style={{ textDecoration: 'none' }}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Minimal inline toast to surface rare errors without blocking UI */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            background: 'rgba(245,158,11,0.95)',
            color: '#111827',
            border: '1px solid rgba(17,24,39,0.12)',
            boxShadow: 'var(--shadow-sm)',
            borderRadius: 10,
            padding: '10px 12px',
            zIndex: 1000,
            maxWidth: '80vw',
            fontWeight: 700,
          }}
        >
          {toast}
        </div>
      )}
    </header>
  );
}
