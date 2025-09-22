import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../supabaseClient';

/**
 * PUBLIC_INTERFACE
 * Login
 * Email/password login with Supabase Auth, shows success/error messages and
 * navigates to redirect target or home upon success.
 */
export default function Login() {
  const supabase = getSupabaseClient();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirect = params.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [state, setState] = useState({ loading: false, error: '', success: '' });

  const onSubmit = async (e) => {
    e.preventDefault();
    setState({ loading: true, error: '', success: '' });
    if (!supabase) {
      setState({ loading: false, error: 'Supabase not configured', success: '' });
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setState({ loading: false, error: '', success: 'Logged in successfully!' });
      setTimeout(() => navigate(redirect), 700);
    } catch (err) {
      setState({ loading: false, error: err?.message || 'Login failed', success: '' });
    }
  };

  return (
    <main className="container">
      <section className="hero" aria-live="polite">
        <div className="hero-top">
          <div className="location">
            <span className="kicker">Welcome back</span>
            <div className="location-line">
              <span role="img" aria-label="lock">🔐</span>
              <span>Login to search weather in any Indian location</span>
            </div>
          </div>
          <div className="actions">
            <Link className="btn btn-ghost" to="/signup">Create account</Link>
          </div>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <label>
            <div className="kicker" style={{ marginBottom: 6 }}>Email</div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
              style={{
                width: '100%',
                borderRadius: 10,
                border: '1px solid rgba(17,24,39,0.12)',
                padding: '10px 12px',
              }}
            />
          </label>
          <label>
            <div className="kicker" style={{ marginBottom: 6 }}>Password</div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="********"
              style={{
                width: '100%',
                borderRadius: 10,
                border: '1px solid rgba(17,24,39,0.12)',
                padding: '10px 12px',
              }}
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={state.loading}>
            {state.loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {state.error && (
          <div className="card" role="alert" style={{ borderColor: 'rgba(239,68,68,0.35)', marginTop: 12 }}>
            <div className="card-title" style={{ color: 'var(--error)' }}>⚠️ Error</div>
            <div className="card-value" style={{ fontSize: '1rem', fontWeight: 600 }}>{state.error}</div>
          </div>
        )}
        {state.success && (
          <div className="card" role="status" style={{ borderColor: 'rgba(245,158,11,0.35)', marginTop: 12 }}>
            <div className="card-title" style={{ color: 'var(--secondary)' }}>✅ Success</div>
            <div className="card-value" style={{ fontSize: '1rem', fontWeight: 600 }}>{state.success}</div>
          </div>
        )}
      </section>
    </main>
  );
}
