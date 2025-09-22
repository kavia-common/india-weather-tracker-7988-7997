import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PUBLIC_INTERFACE
 * ProtectedRoute
 * Wraps a route element and ensures only authenticated users can access it.
 * Redirects to /login with a redirect parameter if user is not authenticated.
 *
 * Now uses centralized AuthContext to avoid duplicated Supabase subscriptions and race conditions.
 * Shows a minimal loading indicator if the auth state is uncertain.
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return <div style={{ padding: 20 }}>Checking authentication...</div>;
  }

  if (!user) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectTo}`} replace />;
  }

  return children;
}
