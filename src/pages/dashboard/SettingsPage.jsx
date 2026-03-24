import React, { useState, useEffect } from 'react';
import { User, CreditCard, Bell, Shield, LogOut, Palette, Type, Save, RotateCcw, Check, Sparkles, ExternalLink, RefreshCw, Crown } from 'lucide-react';
import { generateBrandKit as generateBrandIdentity } from '../../ai/pipeline';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getUserSubscription } from '../../services/userService';
import { getRemainingGenerations } from '../../utils/planPermissions';
import { useNavigate } from 'react-router-dom';
import { getBrands, getActiveBrand, saveBrand } from '../../utils/storage';

const SettingsPage = () => {
  const [brandData, setBrandData] = useState(null);
  const [localColors, setLocalColors] = useState({
    primary: '#0F0F0F',
    secondary: '#F5F5F5',
    accent: '#C6A96B',
    highlight: '#6B7CFF'
  });
  const [localFonts, setLocalFonts] = useState({
    headline: 'Playfair Display',
    body: 'Inter'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const remainingGens = getRemainingGenerations();
  
  const [prefs, setPrefs] = useState({ email: true, marketing: false });

  useEffect(() => {
    if (user) {
      getUserSubscription(user.id).then(({ data }) => setSubscription(data));
    }
  }, [user]);

  useEffect(() => {
    const fetchBrand = async () => {
      let data = await getActiveBrand();
      
      if (!data) {
        const savedSession = sessionStorage.getItem('currentBrandKit');
        if (savedSession) {
          try {
            data = JSON.parse(savedSession);
          } catch (err) {
            console.error('Failed to parse brand kit:', err);
          }
        }
      }

      // If no data or partial data, fetch mock defaults and merge
      if (!data || !data.brandArchetype || !data.colors) {
        const fallbackData = await generateBrandIdentity({});
        data = {
          ...fallbackData,
          ...data,
          colors: { ...fallbackData.colors, ...data?.colors },
          typography: { ...fallbackData.typography, ...data?.typography }
        };
        // Auto-initialize if it was missing
        await saveBrand(data);
      }

      setBrandData(data);
      if (data.colors) setLocalColors(data.colors);
      if (data.typography) {
        setLocalFonts({
          headline: data.typography.headline || 'Playfair Display',
          body: data.typography.body || 'Inter'
        });
      }
    };
    fetchBrand();
  }, []);

  const updateBrandInStorage = async (updatedKit, snapshotSource = null) => {
    // 1. Handle Version History push if there's a snapshot source
    if (snapshotSource) {
      const vHistory = updatedKit.versionHistory || [];
      const vNumber = vHistory.length + 1;
      
      const snapshot = JSON.parse(JSON.stringify(snapshotSource));
      delete snapshot.versionHistory;
      
      updatedKit.versionHistory = [
        ...vHistory,
        {
          id: crypto.randomUUID(),
          version: `v${vNumber}`,
          createdAt: new Date().toISOString(),
          data: snapshot
        }
      ];
    }

    // 2. Storage Persistence
    await saveBrand(updatedKit);
    sessionStorage.setItem('currentBrandKit', JSON.stringify(updatedKit));
    window.dispatchEvent(new Event('kreavia_brands_updated'));
  };

  const handleSave = () => {
    setIsSaving(true);
    
    const activeId = localStorage.getItem('kreavia_active_brand_id');
    const rawBrands = localStorage.getItem('kreavia_user_brands');
    const userBrands = rawBrands ? JSON.parse(rawBrands) : [];
    
    let currentKit = userBrands.find(b => b.id === activeId);
    if (!currentKit) {
       const currentKitJson = sessionStorage.getItem('currentBrandKit');
       currentKit = currentKitJson ? JSON.parse(currentKitJson) : (brandData || {});
    }
    
    const updatedKit = {
      ...currentKit,
      colors: {
        ...(currentKit.colors || {}),
        ...localColors
      },
      typography: {
        ...(currentKit.typography || {}),
        headline: localFonts.headline,
        body: localFonts.body
      },
      lastUpdated: new Date().toISOString()
    };
    
    // Pass currentKit as the snapshot source to log the version history!
    updateBrandInStorage(updatedKit, currentKit);
    
    setTimeout(() => {
      setIsSaving(false);
      setShowSavedToast(true);
      setBrandData(updatedKit);
      setTimeout(() => setShowSavedToast(false), 3000);
    }, 800);
  };

  const handleReset = () => {
    const defaults = {
      primary: '#0F0F0F',
      secondary: '#F5F5F5',
      accent: '#C6A96B',
      highlight: '#6B7CFF'
    };
    const fontDefaults = {
      headline: 'Playfair Display',
      body: 'Inter'
    };
    setLocalColors(defaults);
    setLocalFonts(fontDefaults);
    
    const activeId = localStorage.getItem('kreavia_active_brand_id');
    const rawBrands = localStorage.getItem('kreavia_user_brands');
    const userBrands = rawBrands ? JSON.parse(rawBrands) : [];
    
    let currentKit = userBrands.find(b => b.id === activeId);
    if (!currentKit) {
       const currentKitJson = sessionStorage.getItem('currentBrandKit');
       currentKit = currentKitJson ? JSON.parse(currentKitJson) : (brandData || {});
    }
    
    const updatedKit = {
      ...currentKit,
      colors: defaults,
      typography: {
        ...(currentKit.typography || {}),
        headline: fontDefaults.headline,
        body: fontDefaults.body
      },
      lastUpdated: new Date().toISOString()
    };
    
    updateBrandInStorage(updatedKit, currentKit);
    
    setBrandData(updatedKit);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const fontOptions = [
    'Inter', 'Playfair Display', 'Satoshi', 'Outfit', 'Montserrat', 'Roboto', 'Lora', 'Space Grotesk'
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-12 max-w-4xl pb-24 relative">
      
      {/* Saved Toast */}
      <AnimatePresence>
        {showSavedToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-50 bg-accent text-primary px-6 py-3 rounded-full font-bold shadow-glow flex items-center gap-2"
          >
            <Check size={18} /> Settings saved successfully
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center border-b border-light pb-8">
         <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-accent/10 text-accent">
               <Shield size={32} />
            </div>
            <div>
               <h2 className="text-4xl font-headline text-primary font-bold">System Settings</h2>
               <p className="text-muted text-sm font-medium">Fine-tune your brand environment and account preferences.</p>
            </div>
         </div>
         <div className="flex gap-4">
            <button onClick={handleReset} className="btn btn-outline border-accent/20 text-accent hover:border-accent font-bold text-xs px-6 flex items-center gap-2">
               <RotateCcw size={14} /> Reset Defaults
            </button>
            <button onClick={handleSave} disabled={isSaving} className="btn btn-primary px-8 flex items-center gap-2 shadow-glow font-bold">
               {isSaving ? <div className="w-4 h-4 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin"></div> : <Save size={16} />}
               {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
         </div>
      </div>
      
      {/* Brand Customization Section */}
      <section className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
           <h3 className="text-2xl font-headline font-bold text-primary flex items-center gap-4">
             <div className="p-2 rounded-lg bg-accent/10 text-accent"><Palette size={20} /></div>
             Brand Visuals
           </h3>
           {brandData && (
             <div className="flex items-center gap-3 px-4 py-1.5 bg-primary text-secondary rounded-full shadow-sm">
                <Sparkles size={14} className="text-accent" />
                <span className="text-[10px] uppercase tracking-widest font-black text-accent">{brandData.brandArchetype}</span>
             </div>
           )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Color Picker Grid */}
            <div className="glass-card p-10 border-none shadow-sm flex flex-col gap-8 bg-surface">
               <h4 className="font-headline text-xl font-bold text-primary flex items-center gap-3">
                  Color Palette
               </h4>
              <div className="grid grid-cols-2 gap-4">
                 {[
                   { key: 'primary', label: 'Primary (Dark)' },
                   { key: 'secondary', label: 'Secondary (Light)' },
                   { key: 'accent', label: 'Brand Accent' },
                   { key: 'highlight', label: 'Highlight' }
                 ].map(color => (
                   <div key={color.key} className="flex flex-col gap-2">
                      <label className="text-[11px] uppercase tracking-wider font-bold text-muted ml-1">{color.label}</label>
                      <div className="relative flex items-center">
                         <input 
                            type="color" 
                            value={localColors[color.key]} 
                            onChange={(e) => setLocalColors(prev => ({ ...prev, [color.key]: e.target.value }))}
                            className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer absolute left-1"
                         />
                         <input 
                            type="text" 
                            value={localColors[color.key]} 
                            onChange={(e) => setLocalColors(prev => ({ ...prev, [color.key]: e.target.value }))}
                            className="input bg-primary/30 pl-14 text-xs font-mono"
                         />
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Typography Grid */}
            <div className="glass-card p-10 border-none shadow-sm flex flex-col gap-8 bg-surface">
               <h4 className="font-headline text-xl font-bold text-primary flex items-center gap-3">
                  Typography
               </h4>
              <div className="flex flex-col gap-4">
                 <div className="flex flex-col gap-2">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-muted ml-1">Headline Font</label>
                    <select 
                       value={localFonts.headline}
                       onChange={(e) => setLocalFonts(prev => ({ ...prev, headline: e.target.value }))}
                       className="input bg-primary/30 appearance-none cursor-pointer focus:border-accent/50"
                    >
                       {fontOptions.map(font => <option key={font} value={font}>{font}</option>)}
                    </select>
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-muted ml-1">Body Font</label>
                    <select 
                       value={localFonts.body}
                       onChange={(e) => setLocalFonts(prev => ({ ...prev, body: e.target.value }))}
                       className="input bg-primary/30 appearance-none cursor-pointer focus:border-accent/50"
                    >
                       {fontOptions.map(font => <option key={font} value={font}>{font}</option>)}
                    </select>
                 </div>
                 <div className="mt-2 p-4 bg-primary/20 rounded-lg border border-light/50">
                    <div style={{ fontFamily: localFonts.headline }} className="text-lg text-primary mb-1">Previewing Headline</div>
                    <div style={{ fontFamily: localFonts.body }} className="text-xs text-muted leading-relaxed">This is how your brand body copy will look across all templates and mockups.</div>
                 </div>
              </div>
           </div>
        </div>
      </section>
      
      {/* Profile Section */}
      <section className="flex flex-col gap-8">
        <h3 className="text-2xl font-headline font-bold text-primary flex items-center gap-4 border-b border-light pb-6">
          <div className="p-2 rounded-lg bg-accent/10 text-accent"><User size={20} /></div>
          Profile Information
        </h3>
        
        <div className="glass-card p-10 flex flex-col md:flex-row gap-10 items-center border-none shadow-sm bg-surface">
           <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden shrink-0 border-4 border-white shadow-md p-1">
             <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Profile" className="w-full h-full object-cover rounded-full" />
           </div>
           
           <div className="flex-1 flex flex-col gap-6 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="flex flex-col gap-2">
                   <label className="text-[10px] uppercase tracking-widest font-black text-muted ml-1">Display Name</label>
                   <input type="text" className="input bg-secondary border-light text-primary font-bold" defaultValue="Alex Lifestyle" />
                 </div>
                 <div className="flex flex-col gap-2">
                   <label className="text-[10px] uppercase tracking-widest font-black text-muted ml-1">Email Address</label>
                   <input type="email" className="input bg-secondary border-light text-primary font-bold" defaultValue="alex@example.com" />
                 </div>
              </div>
              <button className="px-6 py-2.5 rounded-full border border-black/10 text-gray-800 font-bold hover:bg-gray-50 bg-white self-start mt-2 transition-colors shadow-sm">Update Profile</button>
           </div>
        </div>
      </section>
 
      {/* Subscription Section */}
      <section className="flex flex-col gap-8">
        <h3 className="text-2xl font-headline font-bold text-primary flex items-center gap-4 border-b border-light pb-6">
          <div className="p-2 rounded-lg bg-accent/10 text-accent"><CreditCard size={20} /></div>
          Plan & Billing
        </h3>
        
        {(!subscription || subscription.plan === 'free') ? (
          /* FREE USER */
          <div className="p-10 border border-light flex flex-col md:flex-row justify-between items-center gap-8 rounded-[2.5rem] bg-surface shadow-sm">
             <div className="relative z-10 text-center md:text-left">
               <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
                  <span className="text-3xl font-headline text-primary font-bold">Free Forever</span>
                  <span className="px-3 py-1 rounded-full bg-light text-muted text-[10px] font-black uppercase tracking-widest">Free Plan</span>
               </div>
               <p className="text-muted text-sm font-medium">
                 You have <span className="text-primary font-bold">{remainingGens} AI generations</span> remaining this month.
               </p>
             </div>
             
             <button 
               onClick={() => navigate('/pricing')}
               className="btn btn-primary px-10 py-4 rounded-full font-bold shadow-glow flex items-center gap-2"
             >
               <Crown size={18} /> Upgrade to Pro
             </button>
          </div>
        ) : subscription.status === 'cancelled' ? (
          /* CANCELLED USER */
          <div className="p-10 border border-orange-200 shadow-xl flex flex-col md:flex-row justify-between items-center gap-8 rounded-[2.5rem] bg-orange-50/30 relative overflow-hidden group">
             <div className="relative z-10 text-center md:text-left">
               <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
                  <span className="text-3xl font-headline text-primary font-bold">Pro Studio</span>
                  <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest border border-orange-200">
                    Pro — Cancels on {new Date(subscription.renewal_date).toLocaleDateString()}
                  </span>
               </div>
               <p className="text-muted text-sm font-medium max-w-md">
                 Your Pro access continues until {new Date(subscription.renewal_date).toLocaleDateString()}. Resubscribe anytime to keep your Pro features.
               </p>
             </div>
             
             <button 
                onClick={() => navigate('/pricing')}
                className="btn bg-orange-500 text-white hover:bg-orange-600 px-10 py-4 rounded-full font-bold shadow-lg flex items-center gap-2 border-none"
             >
               <RefreshCw size={18} /> Resubscribe
             </button>
          </div>
        ) : (
          /* ACTIVE PRO USER */
          <div className="p-10 border border-primary shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 rounded-[2.5rem] relative overflow-hidden group" style={{ background: '#0F0F0F', color: '#FFFFFF' }}>
             <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-3xl rounded-full -mr-32 -mt-32 group-hover:bg-accent/20 transition-colors"></div>
             <div className="relative z-10 text-center md:text-left">
               <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
                  <span className="text-3xl font-headline text-white font-bold">Pro Studio</span>
                  <span className="px-3 py-1 rounded-full bg-accent text-[#0F0F0F] text-[10px] font-black uppercase tracking-widest">Active</span>
               </div>
               <div className="flex flex-col gap-1">
                 <p className="opacity-70 text-sm font-medium text-white/80">
                   Next billing date: <span className="text-white font-bold">{new Date(subscription.renewal_date || new Date().setDate(new Date().getDate() + 30)).toLocaleDateString()}</span>
                 </p>
                 <p className="opacity-70 text-xs font-bold text-accent uppercase tracking-wider">
                   Amount: {subscription.plan === 'pro_yearly' ? '$171/year' : '$19/month'}
                 </p>
               </div>
             </div>
             
             <div className="flex gap-4 w-full md:w-auto relative z-10">
               <button 
                 onClick={() => window.open('https://app.lemonsqueezy.com/billing', '_blank')} 
                 className="bg-white text-black px-8 py-3 rounded-full font-bold shadow-lg transition-colors hover:bg-gray-200 flex items-center gap-2 border-none" 
                 style={{ color: '#0F0F0F' }}
               >
                 Manage Subscription <ExternalLink size={16} />
               </button>
             </div>
          </div>
        )}
      </section>

      {/* Preferences Section */}
      <section className="flex flex-col gap-8">
        <h3 className="text-2xl font-headline font-bold text-primary flex items-center gap-4 border-b border-light pb-6">
          <div className="p-2 rounded-lg bg-accent/10 text-accent"><Bell size={20} /></div>
          Personal Preferences
        </h3>
        
        <div className="glass-card flex flex-col border-none shadow-sm divide-y divide-black/5 bg-white overflow-hidden">
           <div 
             onClick={() => setPrefs(p => ({...p, email: !p.email}))}
             className="p-8 flex justify-between items-center hover:bg-black/[0.02] transition-colors cursor-pointer group"
           >
              <div>
                <h4 className="font-headline text-lg font-bold text-gray-900">Email Notifications</h4>
                <p className="text-gray-500 text-sm mt-1 font-medium">Receive weekly content generation ideas in your inbox.</p>
              </div>
              <div className={`w-14 h-7 rounded-full relative cursor-pointer shadow-inner border border-black/5 transition-colors duration-300 ${prefs.email ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                 <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md transition-all duration-300 ${prefs.email ? 'right-1' : 'left-1'}`}></div>
              </div>
           </div>
 
           <div 
             onClick={() => setPrefs(p => ({...p, marketing: !p.marketing}))}
             className="p-8 flex justify-between items-center hover:bg-black/[0.02] transition-colors cursor-pointer group"
           >
              <div>
                <h4 className="font-headline text-lg font-bold text-gray-900">Marketing Insights</h4>
                <p className="text-gray-500 text-sm mt-1 font-medium">Allow AI to scan your public social stats for better recommendations.</p>
              </div>
              <div className={`w-14 h-7 rounded-full relative cursor-pointer shadow-inner border border-black/5 transition-colors duration-300 ${prefs.marketing ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                 <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md transition-all duration-300 ${prefs.marketing ? 'right-1' : 'left-1'}`}></div>
              </div>
           </div>
           
           <div className="p-8 flex justify-between items-center hover:bg-black/[0.02] transition-colors cursor-pointer group">
              <div>
                <h4 className="font-headline text-lg font-bold text-gray-900">Data Privacy</h4>
                <p className="text-gray-500 text-sm mt-1 font-medium">Manage exactly how your data is used for AI generation models.</p>
              </div>
              <Shield className="text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" size={24} />
           </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="flex flex-col gap-6 mt-8">
         <button className="px-6 py-3 rounded-xl border border-red-200 text-red-500 bg-white font-bold hover:bg-red-50 self-start flex items-center gap-2 transition-colors shadow-sm">
           <LogOut size={18} /> Sign Out of Kreavia.ai
         </button>
      </section>

    </div>
  );
};

export default SettingsPage;
