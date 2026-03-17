import React, { useState, useEffect } from 'react';
import { User, CreditCard, Bell, Shield, LogOut, Palette, Type, Save, RotateCcw, Check, Sparkles } from 'lucide-react';
import { generateBrandKit as generateBrandIdentity } from '../../ai/pipeline';
import { motion, AnimatePresence } from 'framer-motion';

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

  useEffect(() => {
    const fetchBrand = async () => {
      const savedKit = sessionStorage.getItem('currentBrandKit');
      let data = null;
      
      if (savedKit) {
        try {
          data = JSON.parse(savedKit);
        } catch (err) {
          console.error('Failed to parse brand kit:', err);
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
        sessionStorage.setItem('currentBrandKit', JSON.stringify(data));
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

  const handleSave = () => {
    setIsSaving(true);
    
    // Safety check: ensure we preserve existing brand properties
    const currentKitJson = sessionStorage.getItem('currentBrandKit');
    let currentKit = currentKitJson ? JSON.parse(currentKitJson) : (brandData || {});
    
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
    
    sessionStorage.setItem('currentBrandKit', JSON.stringify(updatedKit));
    
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
    
    const currentKitJson = sessionStorage.getItem('currentBrandKit');
    const currentKit = currentKitJson ? JSON.parse(currentKitJson) : {};
    
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
    sessionStorage.setItem('currentBrandKit', JSON.stringify(updatedKit));
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
              <button className="btn btn-outline border-accent/20 text-accent font-bold self-start mt-2">Update Profile</button>
           </div>
        </div>
      </section>
 
      {/* Subscription Section */}
      <section className="flex flex-col gap-8">
        <h3 className="text-2xl font-headline font-bold text-primary flex items-center gap-4 border-b border-light pb-6">
          <div className="p-2 rounded-lg bg-accent/10 text-accent"><CreditCard size={20} /></div>
          Plan & Billing
        </h3>
        
        <div className="glass-card p-10 border-none shadow-md flex flex-col md:flex-row justify-between items-center gap-8 bg-primary text-secondary relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-3xl rounded-full -mr-32 -mt-32 group-hover:bg-accent/20 transition-colors"></div>
           <div className="relative z-10">
             <div className="flex items-center gap-4 mb-3">
                <span className="text-3xl font-headline text-secondary font-bold">Creator Pro Plan</span>
                <span className="px-3 py-1 rounded-full bg-accent text-primary text-[10px] font-black uppercase tracking-widest">Active</span>
             </div>
             <p className="opacity-70 text-sm font-medium">You have unlimited AI generations and full template access.</p>
           </div>
           
           <div className="flex gap-4 w-full md:w-auto relative z-10">
             <button className="btn bg-secondary text-primary px-8 py-3 font-bold shadow-lg hover:bg-white transition-colors">Manage Billing</button>
           </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="flex flex-col gap-8">
        <h3 className="text-2xl font-headline font-bold text-primary flex items-center gap-4 border-b border-light pb-6">
          <div className="p-2 rounded-lg bg-accent/10 text-accent"><Bell size={20} /></div>
          Personal Preferences
        </h3>
        
        <div className="glass-card flex flex-col border-none shadow-sm divide-y divide-light bg-surface overflow-hidden">
           <div className="p-8 flex justify-between items-center hover:bg-black/[0.02] transition-colors cursor-pointer group">
              <div>
                <h4 className="font-headline text-lg font-bold text-primary group-hover:text-accent transition-colors">Email Notifications</h4>
                <p className="text-muted text-sm mt-1 font-medium">Receive weekly content generation ideas in your inbox.</p>
              </div>
              <div className="w-14 h-7 bg-accent rounded-full relative cursor-pointer shadow-inner">
                 <div className="w-5 h-5 bg-white rounded-full absolute top-1 right-1 shadow-md"></div>
              </div>
           </div>
 
           <div className="p-8 flex justify-between items-center hover:bg-black/[0.02] transition-colors cursor-pointer group">
              <div>
                <h4 className="font-headline text-lg font-bold text-primary group-hover:text-accent transition-colors">Marketing Insights</h4>
                <p className="text-muted text-sm mt-1 font-medium">Allow AI to scan your public social stats for better recommendations.</p>
              </div>
              <div className="w-14 h-7 bg-accent rounded-full relative cursor-pointer shadow-inner">
                 <div className="w-5 h-5 bg-white rounded-full absolute top-1 right-1 shadow-md"></div>
              </div>
           </div>
           
           <div className="p-8 flex justify-between items-center hover:bg-black/[0.02] transition-colors cursor-pointer group">
              <div>
                <h4 className="font-headline text-lg font-bold text-primary group-hover:text-accent transition-colors">Data Privacy</h4>
                <p className="text-muted text-sm mt-1 font-medium">Manage exactly how your data is used for AI generation models.</p>
              </div>
              <Shield className="text-accent opacity-40 group-hover:opacity-100 transition-opacity" size={24} />
           </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="flex flex-col gap-6 mt-8">
         <button className="btn btn-outline text-red-400 border-red-400/30 hover:border-red-400 hover:text-red-300 self-start flex items-center gap-2 px-6 py-3">
           <LogOut size={18} /> Sign Out of Kreavia.ai
         </button>
      </section>

    </div>
  );
};

export default SettingsPage;
