import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import App from './App';
import SearchWeather from './pages/SearchWeather';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AuthCallback from './components/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

/**
 * PUBLIC_INTERFACE
 * RootRouter
 * Application entry with React Router setup and global Header.
 * Provides AuthContext at the app level so components consume a single source of truth for auth state.
 */
export default function RootRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <Header />
          <Routes>
            <Route path="/" element={<App />} />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <SearchWeather />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            {/* Supabase auth callback route */}
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
