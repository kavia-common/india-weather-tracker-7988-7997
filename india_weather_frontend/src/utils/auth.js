import { getURL } from './getURL';
import { getSupabaseClient } from '../supabaseClient';

export const handleAuthError = (error, routerPush = () => {}) => {
  if (!error) return;
  console.error('Authentication error:', error);
  const msg = error?.message || '';

  if (msg.includes('redirect')) {
    routerPush('/auth/error?type=redirect');
  } else if (msg.includes('email')) {
    routerPush('/auth/error?type=email');
  } else {
    routerPush('/auth/error');
  }
};

// Optional helpers (not wired into UI yet)
export const signUp = async (email, password) => {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getURL()}auth/callback`,
    },
  });
  return { data, error };
};

export const resetPassword = async (email) => {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getURL()}auth/reset-password`,
  });
  return { data, error };
};

export const signInWithMagicLink = async (email) => {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${getURL()}auth/callback`,
    },
  });
  return { data, error };
};

export const signInWithOAuth = async (provider) => {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${getURL()}auth/callback`,
    },
  });
  return { data, error };
};
