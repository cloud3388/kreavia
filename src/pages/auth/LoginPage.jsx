import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle } from 'lucide-react';
import logo from '../../assets/logo.png';

const LoginPage = () => {
  const [error, setError] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingMicrosoft, setLoadingMicrosoft] = useState(false);
  const [loadingYahoo, setLoadingYahoo] = useState(false);
  
  const { user, loading, signInWithGoogle, signInWithMicrosoft, signInWithYahoo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';
  const context = location.state?.context || 'login';

  // Redirect logged in users immediately
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // Handle specific auth errors from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam === 'not_registered') {
      setError('Account not found. Please sign up first.');
    }
  }, []);

  let subtitle = 'Welcome back. Sign in to continue';
  if (context === 'get_started') {
    subtitle = 'Create your free account to get started';
  } else if (context === 'upgrade') {
    subtitle = 'Sign in to upgrade your account';
  }

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1));
      const errorDesc = params.get('error_description');
      if (errorDesc) {
        setError(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setLoadingGoogle(true);
      setError('');
      const { error } = await signInWithGoogle('login');
      if (error) throw error;
      // AuthCallbackPage will handle navigation
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    try {
      setLoadingMicrosoft(true);
      setError('');
      const { error } = await signInWithMicrosoft('login');
      if (error) throw error;
      // AuthCallbackPage will handle navigation
    } catch (err) {
      setError(err.message || 'Failed to sign in with Microsoft');
    } finally {
      setLoadingMicrosoft(false);
    }
  };

  const handleYahooSignIn = async () => {
    try {
      setLoadingYahoo(true);
      setError('');
      const { error } = await signInWithYahoo('login');
      if (error) throw error;
      // AuthCallbackPage will handle navigation
    } catch (err) {
      setError(err.message || 'Failed to sign in with Yahoo');
    } finally {
      setLoadingYahoo(false);
    }
  };

  if (user && !loading) return null;

  return (
    <div className="container min-h-[80vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md glass-card p-8 animate-slide-up">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-primary shadow-glow flex-shrink-0">
              <img src={logo} alt="Kreavia logo" className="w-6 h-6 object-contain" />
            </div>
            <h1 className="text-3xl font-headline font-bold tracking-tight">Kreavia<span className="text-accent">.ai</span></h1>
          </div>
          <p className="text-muted text-sm font-medium">{subtitle}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-md mb-6 flex items-start gap-3 animate-fade-in text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loadingGoogle}
            className="btn btn-outline w-full py-3 px-6 flex items-center justify-start gap-4 hover:bg-light/10 transition-colors"
          >
            <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </div>
            <span className="flex-1 text-center font-medium mr-6">
              {loadingGoogle ? 'Connecting...' : 'Continue with Google'}
            </span>
          </button>

          <button
            onClick={handleMicrosoftSignIn}
            disabled={loadingMicrosoft}
            className="btn btn-outline w-full py-3 px-6 flex items-center justify-start gap-4 hover:bg-light/10 transition-colors"
          >
            <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.4 24H0V12.6h11.4V24z" fill="#00a4ef" />
                <path d="M24 24H12.6V12.6H24V24z" fill="#ffb900" />
                <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#f25022" />
                <path d="M24 11.4H12.6V0H24v11.4z" fill="#7fba00" />
              </svg>
            </div>
            <span className="flex-1 text-center font-medium mr-6">
              {loadingMicrosoft ? 'Connecting...' : 'Continue with Microsoft'}
            </span>
          </button>

          <button
            onClick={handleYahooSignIn}
            disabled={loadingYahoo}
            className="btn btn-outline w-full py-3 px-6 flex items-center justify-start gap-4 hover:bg-light/10 transition-colors"
          >
            <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.035 2.054a.434.434 0 0 0-.38-.285h-2.91a.434.434 0 0 0-.388.24l-3.23 6.94L6.15 2.01a.433.433 0 0 0-.386-.24H2.43a.433.433 0 0 0-.376.64l4.902 8.7L6.91 22h3.5v-8.72l5.63-11.22z" fill="#6001D2"/>
                <path d="M18.8 13.91v-2.85h2.86v2.85h-2.85zm0 8.09v-7h2.86v7h-2.85z" fill="#6001D2"/>
              </svg>
            </div>
            <span className="flex-1 text-center font-medium mr-6">
              {loadingYahoo ? 'Connecting...' : 'Continue with Yahoo'}
            </span>
          </button>
        </div>

        <p className="text-center mt-8 text-sm text-muted">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent hover:underline font-bold">Sign Up</Link>
        </p>

        <p className="text-center mt-4 text-xs text-muted/60">
          We only use your email to create your account. We never post or share anything.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
