import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Palette, Image as ImageIcon, Sparkles, LineChart, Settings, Search, Bell, Zap, LogOut, User as UserIcon } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import UpgradeModal from '../UpgradeModal';
import { useAuth } from '../../context/AuthContext';

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} className="md:w-5 md:h-5 w-6 h-6" /> },
    { name: 'Brand Kit', path: '/dashboard/brand-kit', icon: <Palette size={20} className="md:w-5 md:h-5 w-6 h-6" /> },
    { name: 'Templates', path: '/dashboard/templates', icon: <ImageIcon size={20} className="md:w-5 md:h-5 w-6 h-6" /> },
    { name: 'Content Ideas', path: '/dashboard/content', icon: <Sparkles size={20} className="md:w-5 md:h-5 w-6 h-6" /> },
    { name: 'Analytics', path: '/dashboard/analytics', icon: <LineChart size={20} className="md:w-5 md:h-5 w-6 h-6" /> },
    { name: 'Settings', path: '/dashboard/settings', icon: <Settings size={20} className="md:w-5 md:h-5 w-6 h-6" />, desktopOnly: true },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-[100dvh] bg-main overflow-hidden text-secondary selection:bg-accent/20">
      
      {/* Upgrade Modal */}
      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      {/* Sidebar - Desktop 240px */}
      <aside className="hidden md:flex w-[240px] border-r border-light flex-col bg-surface z-20 shrink-0 shadow-lg">
        <div className="h-[72px] flex items-center px-6 border-b border-light shrink-0 bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-secondary font-headline font-bold text-lg shadow-sm group-hover:shadow-glow transition-shadow">
              K
            </div>
            <Link to="/" className="font-headline text-xl font-bold tracking-tight text-primary">Kreavia.ai</Link>
          </div>
        </div>
        
        <nav className="flex-1 py-8 px-4 flex flex-col gap-2 overflow-y-auto">
          <div className="text-secondary/40 text-[10px] uppercase font-bold tracking-widest px-4 mb-2 font-ui">Studio</div>
          {navItems.map((item) => {
            const isActive = location.pathname.includes(item.path) && (item.path !== '/dashboard' || location.pathname === '/dashboard');
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-ui text-sm relative group ${isActive ? 'bg-accent/10 text-accent font-bold' : 'text-primary/60 hover:bg-accent/5 hover:text-primary'}`}
              >
                {isActive && <motion.div layoutId="sidebarActive" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent rounded-r-full shadow-glow" />}
                <div className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</div>
                <span>{item.name}</span>
              </Link>
            )
          })}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-ui text-sm text-secondary/70 hover:bg-red-500/10 hover:text-red-400 mt-auto"
          >
            <div className="shrink-0"><LogOut size={20} /></div>
            <span>Logout</span>
          </button>
        </nav>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-light bg-main">
           <div className="glass-card p-4 rounded-xl border-accent/20 bg-accent/5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-accent font-ui text-xs font-bold uppercase tracking-widest"><Sparkles size={14} /> Free Plan</div>
              <div className="font-ui text-xs text-muted">You have 3 AI generations left this month.</div>
              <button onClick={() => setUpgradeOpen(true)} className="btn btn-primary h-8 text-xs font-bold w-full shadow-glow">Upgrade to Pro</button>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-[320px] bg-main relative z-10 w-full overflow-hidden">
        <div className="absolute inset-0 bg-white/50 pointer-events-none mix-blend-overlay z-0"></div>

        {/* Top Bar - 72px */}
        <header className="h-[72px] border-b border-light flex items-center justify-between px-4 md:px-8 bg-surface/80 backdrop-blur-md shrink-0 z-30 sticky top-0 shadow-sm">
           
           {/* Mobile Logo */}
           <div className="flex md:hidden items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-secondary font-headline font-bold text-lg">K</div>
             <span className="font-headline text-lg font-bold tracking-tight text-primary">Kreavia.ai</span>
           </div>

           {/* Search Bar - Desktop only */}
           <div className="hidden md:flex flex-1 max-w-md">
             <div className="flex items-center gap-3 bg-secondary/50 px-4 py-2.5 rounded-xl border border-light w-full focus-within:border-accent transition-all shadow-inner">
                <Search size={16} className="text-muted" />
                <input type="text" placeholder="Search templates, ideas..." className="bg-transparent border-none outline-none text-sm w-full font-ui text-primary placeholder:text-muted/60" />
             </div>
           </div>

           <div className="flex items-center gap-3 md:gap-6 ml-auto">
             <button
               onClick={() => setUpgradeOpen(true)}
               className="hidden sm:flex btn btn-outline border-accent/30 text-accent hover:border-accent px-4 py-2 h-9 items-center gap-2 text-xs uppercase tracking-wider font-bold shadow-sm"
             >
               <Zap size={14} /> Upgrade
             </button>
             
             <button className="relative text-muted hover:text-white transition-colors p-2 rounded-full hover:bg-white/5">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-highlight rounded-full border border-main"></span>
             </button>

             <div className="relative">
                <button 
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="w-9 h-9 rounded-full bg-card overflow-hidden border-2 border-primary cursor-pointer hover:border-accent transition-colors shadow-sm ml-2 flex items-center justify-center"
                >
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={18} className="text-accent" />
                  )}
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 glass-card p-2 shadow-lg animate-fade-in z-50">
                    <div className="px-3 py-2 border-b border-light/50 mb-1">
                      <p className="text-xs font-bold text-white truncate">{user?.user_metadata?.full_name || 'User'}</p>
                      <p className="text-[10px] text-muted truncate">{user?.email}</p>
                    </div>
                    <Link to="/dashboard/settings" className="flex items-center gap-2 px-3 py-2 text-xs text-secondary/70 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
                      <Settings size={14} /> Settings
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                )}
             </div>
           </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto relative z-10 p-4 md:p-8 lg:p-10 pb-28 md:pb-8 w-full h-full custom-scrollbar">
           <AnimatePresence mode="wait">
             <motion.div
               key={location.pathname}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
               className="w-full max-w-full"
             >
               <Outlet />
             </motion.div>
           </AnimatePresence>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[80px] bg-card/95 backdrop-blur-xl border-t border-light/50 z-[100] flex items-center justify-around px-2 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
           {navItems.filter(item => !item.desktopOnly).map((item) => {
              const isActive = location.pathname.includes(item.path) && (item.path !== '/dashboard' || location.pathname === '/dashboard');
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex flex-col items-center justify-center gap-1.5 w-16 h-full relative ${isActive ? 'text-accent' : 'text-muted hover:text-white'}`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="mobileNavActive" 
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-accent rounded-b-full shadow-[0_2px_10px_rgba(198,169,107,0.5)]" 
                    />
                  )}
                  <div className={`mt-1 transition-transform ${isActive ? 'scale-110' : 'active:scale-95'}`}>{item.icon}</div>
                  <span className={`text-[10px] font-ui truncate w-full text-center ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
                </Link>
              )
           })}
        </nav>
      </main>

    </div>
  );
};

export default DashboardLayout;

