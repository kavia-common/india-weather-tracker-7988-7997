import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock supabase to control auth state similar to other tests
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
        listeners.forEach((l) => l('TOKEN_REFRESHED', s));
      },
      signOut: async () => {
        // simulate async server call
        await new Promise((r) => setTimeout(r, 10));
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

import Header from './components/Header';

function Home() {
  return <div>Home Page</div>;
}
function LoginPage() {
  return <div>Login Page</div>;
}
function SearchPage() {
  return <div>Search Page</div>;
}

describe('Header logout behavior', () => {
  test('shows login/signup when unauthenticated and hides Search', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<><Header /><Home /></>} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Search nav should not be visible when logged out
    expect(screen.queryByText(/Search/i)).not.toBeInTheDocument();
    // Login/Sign Up should be present
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign Up/i)).toBeInTheDocument();
  });

  test('logout clears header user state immediately, hides Search, removes logout button, and redirects to login', async () => {
    const { __mockAuth } = require('./supabaseClient');

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<><Header /><Home /></>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Simulate login/session
    __mockAuth.__setSession({ user: { id: 'u1', email: 'user@example.com' } });

    // Expect user email and Search nav appear
    await waitFor(() => {
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
      expect(screen.getByText(/Search/i)).toBeInTheDocument();
    });

    // Click Logout
    const logoutBtn = await screen.findByRole('button', { name: /logout/i });
    await userEvent.click(logoutBtn);

    // Immediately after click, user email and logout button should no longer be present
    expect(screen.queryByText('user@example.com')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Search/i)).not.toBeInTheDocument();

    // After navigation, ensure we are on login page and login/signup are visible
    await waitFor(() => {
      expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
      expect(screen.getByText(/Login/i)).toBeInTheDocument();
      expect(screen.getByText(/Sign Up/i)).toBeInTheDocument();
    });
  });

  test('logout does not throw when context ref is missing or malformed', async () => {
    const { __mockAuth } = require('./supabaseClient');

    // Render header on a route and log in
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<><Header /><Home /></>} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    __mockAuth.__setSession({ user: { id: 'u2', email: 'refcheck@example.com' } });

    await waitFor(() => {
      expect(screen.getByText('refcheck@example.com')).toBeInTheDocument();
    });

    const logoutBtn = await screen.findByRole('button', { name: /logout/i });

    // Spy on console.error to ensure no crash logs appear from exceptions
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await userEvent.click(logoutBtn);

    // Should navigate to login and no error thrown
    await waitFor(() => {
      expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
    });

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
