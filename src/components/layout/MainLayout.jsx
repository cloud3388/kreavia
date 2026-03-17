import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, LayoutDashboard, User } from 'lucide-react';
import logo from '../../assets/logo.png';

const MainLayout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary text-primary">
      <nav className="container flex items-center justify-between py-6 border-b border-light shadow-sm bg-secondary/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center group cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="Kreavia Logo" className="h-[18px] w-[18px] object-contain group-hover:scale-110 transition-transform duration-500" />
          </div>
          <Link to="/" className="font-headline text-2xl font-bold text-primary tracking-tight">Kreavia<span className="text-accent">.ai</span></Link>
        </div>
        <div className="hidden md:flex gap-10 items-center">
          <Link to="/" className="text-muted hover:text-accent text-sm font-black uppercase tracking-widest transition-colors px-2">Features</Link>
          <Link to="/" className="text-muted hover:text-accent text-sm font-black uppercase tracking-widest transition-colors px-2">Pricing</Link>
          
          {user ? (
            <div className="flex items-center gap-6">
              <Link 
                to="/dashboard" 
                className="flex items-center gap-2 text-primary hover:text-accent text-sm font-bold transition-colors"
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                className="text-muted hover:text-red-500 text-sm font-bold transition-colors flex items-center gap-2"
              >
                <LogOut size={18} />
                Logout
              </button>
              <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center border border-light shadow-sm">
                <User size={18} className="text-accent" />
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="text-primary hover:text-accent text-sm font-black uppercase tracking-widest transition-colors px-4">Login</Link>
              <Link to="/signup" className="btn btn-primary px-8 py-3 text-sm shadow-glow font-black uppercase tracking-widest text-secondary">Generate My Brand Kit</Link>
            </>
          )}
        </div>
      </nav>
      
      <main className="flex-1">
        <Outlet />
      </main>
      
      <footer className="p-16 border-t flex flex-col items-center justify-center gap-8 border-light bg-surface/50">
        <div className="flex flex-col items-center gap-4">
          <img src={logo} alt="Kreavia Logo" className="h-[18px] w-[18px] object-contain opacity-80" />
          <div className="font-headline text-3xl font-bold text-primary">Kreavia<span className="text-accent">.ai</span></div>
        </div>
        <p className="text-muted text-sm font-medium">Generate your full social media identity with AI intelligence.</p>
      </footer>
    </div>
  );
};

export default MainLayout;

