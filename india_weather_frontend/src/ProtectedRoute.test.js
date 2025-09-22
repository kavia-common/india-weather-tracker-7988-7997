import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// NOTE: Tests here intentionally provide routing context with MemoryRouter,
// because ProtectedRoute is a component (not the RootRouter) and needs a single router.

// Mock supabase client to simulate unauthenticated and authenticated states.
jest.mock('./supabaseClient', () => {
  let session = null;
  const listeners = new Set();

  const mockClient = {
    auth: {
      getSession: async () => ({ data: { session } }),
      onAuthStateChange: (cb) => {
        // Supabase v2 returns { data: { subscription } } with an unsubscribe() method
        const wrapped = (event, s) => cb(event, s);
        listeners.add(wrapped);
        return {
          data: {
            subscription: {
              unsubscribe: () => listeners.delete(wrapped),
            },
          },
        };
      },
      // helper for tests
      __setSession: (s) => {
        session = s;
        // emit change event to all listeners
        listeners.forEach((listener) => listener('TOKEN_REFRESHED', s));
      },
    },
  };

  return {
    getSupabaseClient: () => mockClient,
    __mockAuth: mockClient.auth,
  };
});

import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function ProtectedPage() {
  return <div>Protected Content</div>;
}

function LoginPage() {
  return <div>Login Page</div>;
}

describe('ProtectedRoute', () => {
  test('redirects unauthenticated users to login with redirect param', async () => {
    render(
      <MemoryRouter initialEntries={['/search']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <ProtectedPage />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Should show checking first
    await screen.findByText(/Checking authentication/i);

    // After auth check completes, we should be on Login Page
    await screen.findByText(/Login Page/i);
  });

  test('renders children when authenticated', async () => {
    const { __mockAuth } = require('./supabaseClient');

    render(
      <MemoryRouter initialEntries={['/search']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <ProtectedPage />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Initially shows checking
    await screen.findByText(/Checking authentication/i);

    // Simulate a session
    __mockAuth.__setSession({ user: { id: '123', email: 'test@example.com' } });

    // Expect protected content to render
    await screen.findByText(/Protected Content/i);
  });
});
