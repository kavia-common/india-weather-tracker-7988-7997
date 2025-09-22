import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// NOTE: Use one MemoryRouter here. Do not wrap RootRouter to avoid nested Router issues.

// Mock supabase to control auth state
jest.mock('./supabaseClient', () => {
  let session = null;
  const listeners = new Set();

  const mockClient = {
    auth: {
      getSession: async () => ({ data: { session } }),
      onAuthStateChange: (cb) => {
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
      __setSession: (s) => {
        session = s;
        listeners.forEach((listener) => listener('TOKEN_REFRESHED', s));
      },
      signInWithPassword: async ({ email }) => {
        session = { user: { id: 'u1', email } };
        listeners.forEach((l) => l('SIGNED_IN', session));
        return { data: { session }, error: null };
      },
      signOut: async () => {
        session = null;
        listeners.forEach((l) => l('SIGNED_OUT', null));
        return { error: null };
      },
    },
  };

  return {
    getSupabaseClient: () => mockClient,
    __mockAuth: mockClient.auth,
  };
});

import ProtectedRoute from './components/ProtectedRoute';
import SearchWeather from './pages/SearchWeather';

function LoginPage() {
  return <div>Login Page</div>;
}

describe('Navigation to /search after auth', () => {
  test('loads SearchWeather after session is set', async () => {
    const { __mockAuth } = require('./supabaseClient');

    render(
      <MemoryRouter initialEntries={['/search']}>
        <Routes>
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SearchWeather />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Initially checking auth
    expect(screen.getByText(/Checking authentication/i)).toBeInTheDocument();

    // Authenticate
    __mockAuth.__setSession({ user: { id: 'u1', email: 'user@example.com' } });

    // Search page's kicker text should be visible
    await waitFor(() => {
      expect(screen.getByText(/Search India/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Search/i })).toBeInTheDocument();
    });
  });
});
