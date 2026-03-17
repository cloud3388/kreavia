import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, Chrome } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
      // Note: Redirect is handled by Supabase for actual OAuth
      // In mock mode, it will return success immediately
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google');
    }
  };

  return (
    <div className="container min-h-[80vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md glass-card p-8 animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-primary mx-auto mb-4 shadow-glow">
            <LogIn size={24} />
          </div>
          <h1 className="text-3xl mb-2">Welcome Back</h1>
          <p className="text-muted text-sm">Sign in to continue to Kreavia.ai</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-md mb-6 flex items-start gap-3 animate-fade-in text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-ui uppercase tracking-wider text-muted ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                type="email"
                required
                className="input pl-12"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-ui uppercase tracking-wider text-muted ml-1">Password</label>
              <Link to="/" className="text-xs text-accent hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                type="password"
                required
                className="input pl-12"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3 mt-4"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-light/50"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-primary px-4 text-muted">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="btn btn-outline w-full py-3 flex items-center gap-3"
        >
          <Chrome size={18} />
          Google
        </button>

        <p className="text-center mt-8 text-sm text-muted">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent hover:underline font-semibold">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
