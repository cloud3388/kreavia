import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Palette, Image as ImageIcon, Sparkles, LineChart, Settings, Search, Bell, Zap, LogOut, User as UserIcon, ChevronDown, Check as CheckIcon, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UpgradeModal from '../UpgradeModal';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import { getPlanStatus, getRemainingGenerations } from '../../utils/planPermissions';
import { NudgeBanner } from '../common/UpgradeNudges';
import { getBrands, getActiveBrand } from '../../utils/storage';

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const plan = getPlanStatus();
  const isPro = localStorage.getItem('kreavia_pro_user') === 'true';
  const genCount = getRemainingGenerations();
  
  // Brand Switcher State
  const [userBrands, setUserBrands] = useState([]);
  const [activeBrandId, setActiveBrandId] = useState('');
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const loadBrands = async () => {
    const brands = await getBrands();
    setUserBrands(brands);
    const active = await getActiveBrand();
    setActiveBrandId(active?.id || '');
  };

  React.useEffect(() => {
    loadBrands();
    window.addEventListener('kreavia_brands_updated', loadBrands);

    // Initial account creation date tracking for Nudge 4
    if (!localStorage.getItem('kreavia_account_created_at')) {
      localStorage.setItem('kreavia_account_created_at', new Date().toISOString());
    }

    return () => window.removeEventListener('kreavia_brands_updated', loadBrands);
  }, []);

  const getAccountAgeInDays = () => {
    const createdAt = localStorage.getItem('kreavia_account_created_at');
    if (!createdAt) return 0;
    const diff = new Date() - new Date(createdAt);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const accountAge = getAccountAgeInDays();

  const handleSwitchBrand = (brand) => {
    localStorage.setItem('kreavia_active_brand_id', brand.id);
    sessionStorage.setItem('currentBrandKit', JSON.stringify(brand));
    setActiveBrandId(brand.id);
    setSwitcherOpen(false);
    
    // Notify all components that active brand changed
    window.dispatchEvent(new Event('kreavia_brands_updated'));
    
    const bName = brand.dna?.brand_name || brand.brandName || 'Brand';
    setToastMsg(`Switched to ${bName}`);
    setTimeout(() => setToastMsg(''), 2000);
  };

  let activeBrandObj = userBrands.find(b => b.id === activeBrandId) || userBrands[0] || null;
  
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
    <div className="flex h-[100dvh] bg-main overflow-hidden text-primary selection:bg-accent/20">
      
      {/* Upgrade Modal */}
      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      {/* Global Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-24 left-1/2 md:bottom-10 z-[200] bg-primary text-white px-6 py-3 rounded-full font-ui text-sm font-bold shadow-2xl flex items-center gap-2"
          >
            <CheckIcon size={16} className="text-green-400" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop 240px */}
      <aside className="hidden md:flex w-[240px] border-r border-light flex-col bg-surface z-20 shrink-0 shadow-lg">
        <div className="h-[72px] flex items-center px-6 border-b border-light shrink-0 bg-surface">
          <div className="flex items-center gap-3">
            <div 
              className="flex items-center justify-center cursor-pointer group" 
              onClick={() => navigate('/')}
            >
              <img 
                src={logo} 
                alt="Kreavia Logo" 
                className="navbar-logo group-hover:scale-110 transition-transform duration-500" 
                style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
              />
            </div>
            <Link to="/" className="font-headline text-xl font-bold tracking-tight text-primary">Kreavia.ai</Link>
          </div>
        </div>
        
        <nav className="flex-1 py-8 px-4 flex flex-col gap-2 overflow-y-auto hide-scrollbar">
          
          {/* Brand Switcher */}
          {activeBrandObj && (
            <div className="relative mb-6">
              <div className="text-muted/60 text-[10px] uppercase font-bold tracking-widest px-4 mb-2 font-ui">Active Brand</div>
              <button 
                onClick={() => setSwitcherOpen(!switcherOpen)}
                className="w-full flex items-center justify-between p-2 rounded-xl border border-transparent hover:bg-surface hover:border-light hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-white border border-light/50 flex flex-center p-1 shrink-0">
                    <img src={activeBrandObj.logos?.[0]?.url || activeBrandObj.logo || logo} className="w-full h-full object-contain mix-blend-multiply" alt="Brand Logo" />
                  </div>
                  <span className="font-ui font-bold text-sm text-primary truncate">
                    {activeBrandObj.dna?.brand_name || activeBrandObj.brandName || 'My Brand'}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-muted transition-transform duration-300 ${switcherOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {switcherOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setSwitcherOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-[60px] left-0 w-[240px] bg-white border border-light shadow-xl rounded-xl z-50 py-2 max-h-[300px] overflow-y-auto custom-scrollbar"
                    >
                      <div className="px-3 pb-2 mb-2 border-b border-light/50 text-[10px] font-bold uppercase tracking-widest text-muted">Select Brand</div>
                      <div className="flex flex-col gap-1 px-2">
                        {userBrands.map(b => {
                          const isActive = b.id === activeBrandId;
                          return (
                            <button 
                              key={b.id}
                              onClick={() => handleSwitchBrand(b)}
                              className={`flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${isActive ? 'bg-accent/10' : 'hover:bg-surface'}`}
                            >
                              <div className="w-8 h-8 rounded-full bg-white border border-light/50 p-1 shrink-0 overflow-hidden">
                                <img src={b.logos?.[0]?.url || b.logo || logo} className="w-full h-full object-contain mix-blend-multiply" alt="Logo" />
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className={`text-xs truncate ${isActive ? 'font-bold text-accent' : 'font-medium text-primary'}`}>
                                  {b.dna?.brand_name || b.brandName || 'Brand'}
                                </span>
                                <span className="text-[10px] text-muted truncate">{b.dna?.niche || b.niche || 'Other'}</span>
                              </div>
                              {isActive && <CheckIcon size={12} className="ml-auto text-accent shrink-0" />}
                            </button>
                          )
                        })}
                      </div>
                      <div className="px-2 mt-2 pt-2 border-t border-light/50">
                        <button 
                          onClick={() => { 
                            setSwitcherOpen(false); 
                            if (userBrands.length >= plan.maxBrands) {
                              setUpgradeOpen(true);
                            } else {
                              navigate('/onboarding'); 
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 p-2 rounded-lg hover:bg-surface text-muted hover:text-primary transition-colors text-xs font-bold"
                        >
                          <Plus size={14} /> New Brand
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="text-muted/60 text-[10px] uppercase font-bold tracking-widest px-4 mb-2 font-ui">Studio</div>
          {navItems.map((item) => {
            const isActive = location.pathname.includes(item.path) && (item.path !== '/dashboard' || location.pathname === '/dashboard');
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-ui text-sm relative group ${isActive ? 'bg-accent/10 text-accent font-bold' : 'text-primary/60 hover:bg-accent/5 hover:text-primary'}`}
              >
                {isActive && <motion.div layoutId="sidebarActive" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent rounded-r-full" />}
                <div className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</div>
                <span>{item.name}</span>
              </Link>
            )
          })}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-ui text-sm text-muted hover:bg-red-500/10 hover:text-red-500 mt-auto"
          >
            <div className="shrink-0"><LogOut size={20} /></div>
            <span>Logout</span>
          </button>
        </nav>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-light bg-highlight/30">
           {isPro ? (
             <div className="glass-card p-4 rounded-xl border-accent/30 bg-accent/10 flex flex-col gap-2 shadow-sm border">
               <div className="flex items-center gap-2 text-accent font-ui text-xs font-bold uppercase tracking-widest"><Sparkles size={14} /> Pro Studio</div>
               <div className="font-ui text-xs text-muted">Unlimited AI generations & full template access.</div>
               <div className="flex items-center gap-1.5 mt-1">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Active</span>
               </div>
             </div>
           ) : (
             <div className="glass-card p-4 rounded-xl border-accent/20 bg-accent/5 flex flex-col gap-3 shadow-sm border">
               <div className="flex items-center gap-2 text-accent font-ui text-xs font-bold uppercase tracking-widest"><Sparkles size={14} /> Free Plan</div>
               <div className="font-ui text-xs text-muted">
                 {genCount === 0 ? "No generations left this month." : `You have ${genCount} AI generation${genCount !== 1 ? 's' : ''} left this month.`}
               </div>
               <div className="w-full h-1.5 bg-light rounded-full overflow-hidden">
                 <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${(genCount / 3) * 100}%` }}></div>
               </div>
               <button onClick={() => setUpgradeOpen(true)} className="btn btn-primary h-8 text-xs font-bold w-full">Upgrade to Pro</button>
             </div>
           )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-[320px] bg-main relative z-10 w-full overflow-hidden">
        <div className="absolute inset-0 bg-white/50 pointer-events-none mix-blend-overlay z-0"></div>

        {accountAge >= 25 && !isPro && (
          <NudgeBanner 
            id="urgency_pricing"
            message="Early access pricing ends soon."
            benefit="Lock in Pro at ₹374/month before price increases."
            onUpgrade={() => setUpgradeOpen(true)}
          />
        )}

        {/* Top Bar - 72px */}
        <header className="h-[72px] border-b border-light flex items-center justify-between px-4 md:px-8 bg-surface/80 backdrop-blur-md shrink-0 z-40 sticky top-0 shadow-sm relative">
           
           {/* Mobile Logo */}
           <div className="flex md:hidden items-center gap-3" onClick={() => navigate('/')}>
             <img 
                src={logo} 
                alt="Kreavia Logo" 
                className="navbar-logo" 
                style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
              />
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
             
             <button className="relative text-muted hover:text-primary transition-colors p-2 rounded-full hover:bg-black/5">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border border-surface"></span>
             </button>

             <div className="relative">
                <button 
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="w-9 h-9 rounded-full bg-surface overflow-hidden border border-light cursor-pointer hover:border-accent transition-colors shadow-sm ml-2 flex items-center justify-center"
                >
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={18} className="text-accent" />
                  )}
                </button>

                 {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface border border-light p-2 rounded-xl shadow-lg animate-fade-in z-50">
                    <div className="px-3 py-2 border-b border-light/50 mb-1">
                      <p className="text-xs font-bold text-primary truncate">{user?.user_metadata?.full_name || 'User'}</p>
                      <p className="text-[10px] text-muted truncate">{user?.email}</p>
                    </div>
                    <Link to="/dashboard/settings" className="flex items-center gap-2 px-3 py-2 text-xs text-muted hover:bg-black/5 hover:text-primary rounded-lg transition-colors">
                      <Settings size={14} /> Settings
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                )}
             </div>
           </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto relative z-10 p-4 md:p-8 lg:p-10 pb-[100px] md:pb-8 w-full h-full custom-scrollbar">
           <AnimatePresence mode="wait">
             <motion.div
               key={location.pathname + activeBrandId}
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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[80px] bg-surface/95 backdrop-blur-xl border-t border-light z-[100] flex items-center justify-around px-2 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
           {navItems.filter(item => !item.desktopOnly).map((item) => {
              const isActive = location.pathname.includes(item.path) && (item.path !== '/dashboard' || location.pathname === '/dashboard');
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex flex-col items-center justify-center gap-1.5 w-16 h-full relative ${isActive ? 'text-accent' : 'text-muted hover:text-primary'}`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="mobileNavActive" 
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-accent rounded-b-full shadow-sm" 
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

