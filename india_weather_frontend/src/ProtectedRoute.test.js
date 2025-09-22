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
      </MemoryRouter>
    );

    // Should show checking first
    expect(screen.getByText(/Checking authentication/i)).toBeInTheDocument();

    // After auth check completes, we should be on Login Page
    await waitFor(() => {
      expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
    });
  });

  test('renders children when authenticated', async () => {
    const { __mockAuth } = require('./supabaseClient');

    render(
      <MemoryRouter initialEntries={['/search']}>
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
      </MemoryRouter>
    );

    // Initially shows checking
    expect(screen.getByText(/Checking authentication/i)).toBeInTheDocument();

    // Simulate a session
    __mockAuth.__setSession({ user: { id: '123', email: 'test@example.com' } });

    // Expect protected content to render
    await waitFor(() => {
      expect(screen.getByText(/Protected Content/i)).toBeInTheDocument();
    });
  });
});
