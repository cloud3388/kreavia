import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isMockMode } from '../lib/supabase';

const AuthContext = createContext({});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (isMockMode) {
      // In production, only allow mock session if explicitly enabled via VITE_USE_MOCK_AUTH
      if (import.meta.env.PROD && import.meta.env.VITE_USE_MOCK_AUTH !== 'true') {
        return null;
      }
      const saved = localStorage.getItem('brankit_mock_user');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [loading, setLoading] = useState(!isMockMode);

  useEffect(() => {
    if (isMockMode) return;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, metadata = {}) => {
    if (isMockMode) {
      const newUser = { id: 'mock-uuid-' + Math.random().toString(36).substr(2, 9), email, user_metadata: metadata };
      localStorage.setItem('brankit_mock_user', JSON.stringify(newUser));
      setUser(newUser);
      return { data: { user: newUser }, error: null };
    }
    return await supabase.auth.signUp({ 
      email, 
      password,
      options: { data: metadata }
    });
  };

  const signIn = async (email, password) => {
    if (isMockMode) {
      const mockUser = { 
        id: 'mock-uuid-123', 
        email, 
        user_metadata: { 
          full_name: 'Mock User (Development)',
          avatar_url: 'https://i.pravatar.cc/150?u=mock' 
        } 
      };
      localStorage.setItem('brankit_mock_user', JSON.stringify(mockUser));
      setUser(mockUser);
      return { data: { user: mockUser }, error: null };
    }
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    if (isMockMode) {
      localStorage.removeItem('brankit_mock_user');
      setUser(null);
      return { error: null };
    }
    return await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    if (isMockMode) {
      return signIn('google-user@example.com', 'dummy');
    }
    const redirectUrl = window.location.hostname === 'localhost' 
      ? `${window.location.origin}/auth/callback` 
      : 'https://kreavia.app/auth/callback';

    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      }
    });
  };

  const signInWithMicrosoft = async () => {
    if (isMockMode) {
      return signIn('microsoft-user@example.com', 'dummy');
    }
    const redirectUrl = window.location.hostname === 'localhost' 
      ? `${window.location.origin}/auth/callback` 
      : 'https://kreavia.app/auth/callback';

    return await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: redirectUrl,
      }
    });
  };

  const signInWithYahoo = async () => {
    if (isMockMode) {
      return signIn('yahoo-user@example.com', 'dummy');
    }
    const redirectUrl = window.location.hostname === 'localhost' 
      ? `${window.location.origin}/auth/callback` 
      : 'https://kreavia.app/auth/callback';

    return await supabase.auth.signInWithOAuth({
      provider: 'workos', // fallback as per config
      options: {
        redirectTo: redirectUrl,
      }
    });
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    signInWithMicrosoft,
    signInWithYahoo,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
