import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

/**
 * PUBLIC_INTERFACE
 * Header
 * Branded header that shows navigation, auth state (user email),
 * and Login/Logout controls. Uses Ocean Professional theme styling via App.css.
 *
 * Logout UX:
 * - Relies on AuthContext as the single source of truth.
 * - On logout click: immediately set user=null in context, mark logout in progress,
 *   navigate to /login, and then perform Supabase signOut in the background.
 * - Header listens only to context and does not subscribe directly to Supabase.
 * - Shows a minimal "Auth..." indicator if authLoading is true.
 */
export default function Header() {
  const supabase = getSupabaseClient();
  const { user, setUser, authLoading, __logoutInProgressRef } = useAuth();
  const [toast, setToast] = useState(null); // simple ephemeral toast state
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  // keep a local fallback ref in case context ref is unavailable/mis-shaped
  const localLogoutRef = useRef(false);

  useEffect(() => {
    return () => {
      // ensure we don't update toast after unmount
      mountedRef.current = false;
    };
  }, []);

  // Helper: get current strategy from localStorage (kept to allow profiling)
  const logoutStrategy = useMemo(() => {
    const value =
      (typeof window !== 'undefined' && window.localStorage.getItem('logoutStrategy')) ||
      'fireAndNavigate';
    return value === 'awaitBeforeNav' ? 'awaitBeforeNav' : 'fireAndNavigate';
  }, []);

  const isValidRef = (refObj) =>
    refObj && typeof refObj === 'object' && Object.prototype.hasOwnProperty.call(refObj, 'current');

  const getLogoutRef = () => {
    // Prefer the context ref if it's a proper ref, else use local fallback
    return isValidRef(__logoutInProgressRef) ? __logoutInProgressRef : localLogoutRef;
  };

  const showToast = (message) => {
    try {
      // eslint-disable-next-line no-console
      console.warn('[Header][Toast]', message);
    } catch {
      // ignore
    }
    setToast(String(message));
    window.setTimeout(() => {
      if (mountedRef.current) setToast(null);
    }, 2500);
  };

  // PUBLIC_INTERFACE
  const handleLogout = async () => {
    const flagRef = getLogoutRef();

    if (flagRef.current) {
      // already in progress
      return;
    }
    flagRef.current = true;

    // Clear UI immediately and navigate after state clears
    setUser(null);
    const goLogin = () => navigate('/login', { replace: true });

    if (!supabase) {
      goLogin();
      flagRef.current = false;
      return;
    }

    if (logoutStrategy === 'awaitBeforeNav') {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) showToast('Logout completed locally; server sign-out may be delayed.');
      } catch {
        showToast('Logout completed locally; sign-out encountered a network error.');
      } finally {
        goLogin();
        flagRef.current = false;
      }
      return;
    }

    // Default: fire-and-navigate
    try {
      goLogin();
      // run signOut in background; do not await
      (async () => {
        try {
          const { error } = await supabase.auth.signOut();
          if (error) showToast('Signed out. Server session cleanup had a minor issue.');
        } catch {
          showToast('Signed out. Background cleanup hit an error.');
        } finally {
          flagRef.current = false;
        }
      })();
    } catch {
      flagRef.current = false;
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

          {authLoading ? (
            <span className="location-pill" aria-live="polite" title="Checking session...">
              Auth...
            </span>
          ) : user ? (
            <>
              <span
                className="location-pill"
                title={user.email || 'Authenticated user'}
                data-testid="user-email-pill"
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
