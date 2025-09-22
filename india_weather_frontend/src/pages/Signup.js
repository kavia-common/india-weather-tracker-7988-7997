import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../supabaseClient';
import { getURL } from '../utils/getURL';

/**
 * PUBLIC_INTERFACE
 * Signup
 * Email/password sign up with Supabase Auth and feedback. Redirects after success.
 */
export default function Signup() {
  const supabase = getSupabaseClient();
  const navigate = useNavigate();

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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getURL()}auth/callback`,
        },
      });
      if (error) throw error;
      setState({
        loading: false,
        error: '',
        success: 'Sign up successful! Check your email if confirmation is required.',
      });
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setState({ loading: false, error: err?.message || 'Sign up failed', success: '' });
    }
  };

  return (
    <main className="container">
      <section className="hero" aria-live="polite">
        <div className="hero-top">
          <div className="location">
            <span className="kicker">Join us</span>
            <div className="location-line">
              <span role="img" aria-label="sparkles">✨</span>
              <span>Create an account to search weather across India</span>
            </div>
          </div>
          <div className="actions">
            <Link className="btn btn-ghost" to="/login">I already have an account</Link>
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
            {state.loading ? 'Creating account...' : 'Sign up'}
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
