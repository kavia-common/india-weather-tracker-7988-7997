import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../supabaseClient';

/**
 * PUBLIC_INTERFACE
 * Header
 * Branded header that shows navigation, auth state (user email),
 * and Login/Logout controls. Uses Ocean Professional theme styling via App.css.
 */
export default function Header() {
  const supabase = getSupabaseClient();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      if (!supabase) return;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (mounted) setUser(session?.user ?? null);
      } catch (e) {
        // If session fetch fails, treat as logged out
        if (mounted) setUser(null);
        console.warn('[Header] getSession error:', e);
      }
    }
    getSession();

    if (supabase) {
      const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
        // Keep local user in sync with Supabase auth state
        setUser(session?.user ?? null);
      });
      return () => {
        subscription?.subscription?.unsubscribe?.();
        mounted = false;
      };
    }
  }, [supabase]);

  const handleLogout = async () => {
    if (!supabase) {
      navigate('/login', { replace: true });
      return;
    }
    try {
      // Attempt sign out; immediately clear local user state for responsive UI
      setUser(null);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('[Header] signOut error:', error);
      }
    } catch (e) {
      console.warn('[Header] signOut exception:', e);
    } finally {
      // Redirect to login to ensure restricted routes are gated
      navigate('/login', { replace: true });
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
    </header>
  );
}
