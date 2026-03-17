import React, { useState, useEffect } from 'react';
import { Palette, Type, Image as ImageIcon, Copy, CheckCircle, Sparkles, AlertCircle } from 'lucide-react';
import { generateBrandIdentity } from '../../services/aiService';
import SocialFeedPreview from '../../components/dashboard/SocialFeedPreview';

const BrandKitPage = () => {
  const [brandData, setBrandData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedVar, setCopiedVar] = useState('');

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        setLoading(true);
        // 1. Try to load from sessionStorage
        const savedKit = sessionStorage.getItem('currentBrandKit');
        let data = null;
        
        if (savedKit) {
          try {
            data = JSON.parse(savedKit);
          } catch (err) {
            console.error('Failed to parse saved brand kit:', err);
          }
        }

        // 2. Fallback to mock generation if no saved kit OR if kit is incomplete
        if (!data || !data.brandArchetype || !data.colors) {
           console.log('[BrandKit] Saved kit incomplete, merging with defaults...');
           const fallbackData = await generateBrandIdentity({});
           data = { 
             ...fallbackData, 
             ...(data || {}), 
             colors: { ...(fallbackData.colors || {}), ...(data?.colors || {}) },
             typography: { ...(fallbackData.typography || {}), ...(data?.typography || {}) }
           };
        }

        setBrandData(data);
      } catch (err) {
        console.error('Crash in BrandKitPage fetch:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBrand();
  }, []);

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedVar(text);
    setTimeout(() => setCopiedVar(''), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-light border-t-accent animate-spin"></div>
          <p className="text-muted">Loading your brand assets...</p>
        </div>
      </div>
    );
  }

  if (error || !brandData) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-6 text-center px-6">
         <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <AlertCircle size={32} />
         </div>
         <div>
            <h3 className="text-2xl font-headline mb-2">Something went wrong</h3>
            <p className="text-muted max-w-md">We couldn't load your brand identity. Try clearing your browser session or resetting to AI defaults.</p>
         </div>
         <button onClick={() => window.location.reload()} className="btn btn-outline border-white/20">Try Again</button>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-12 max-w-6xl pb-24"
    >
      
      {/* Overview Card */}
      <motion.div variants={itemVariants} className="glass-card p-10 flex justify-between items-center border-accent/20 bg-surface relative overflow-hidden group shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <h3 className="text-accent text-[10px] font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <Sparkles size={12} /> Brand Identity DNA
          </h3>
          <div className="text-5xl font-headline text-primary font-bold tracking-tight">{brandData?.brandArchetype || 'The Visionary'}</div>
        </div>
        <div className="text-right relative z-10">
           <div className="text-muted text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Brand Consistency</div>
           <div className="text-6xl font-ui font-black text-primary/5 group-hover:text-accent/10 transition-colors duration-700 absolute -top-6 -right-4 select-none">
             {brandData?.brandScore || 85}%
           </div>
           <div className="text-6xl font-ui font-bold text-primary tracking-tighter">{brandData?.brandScore || 85}<span className="text-2xl text-accent font-medium ml-1">%</span></div>
        </div>
      </motion.div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         
          {/* Logos Row */}
          <motion.div variants={itemVariants} className="lg:col-span-5 flex flex-col gap-6">
             <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-3">
                 <div className="p-2.5 rounded-xl bg-accent/10 text-accent shadow-inner">
                   <ImageIcon size={22} strokeWidth={2.5} />
                 </div>
                 <h3 className="text-2xl font-headline text-primary font-bold">Official Marks</h3>
               </div>
               <button className="text-[10px] font-bold text-accent uppercase tracking-widest hover:text-primary transition-colors border-b border-accent/20 pb-1">Refine Identity</button>
             </div>
             
             <div className="glass-card flex flex-col items-center justify-center relative group overflow-hidden border-light h-[280px] bg-white shadow-lg">
                 <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                 <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-2 rounded-full bg-surface shadow-md cursor-help" title="High Resolution PNG">
                       < ImageIcon size={14} className="text-accent" />
                    </div>
                 </div>
                 <img 
                   src={brandData?.logos?.[0]?.url || "https://placehold.co/400x400/3E2723/FDF8F1?text=Logo"} 
                   alt="Primary Logo" 
                   className="w-40 h-40 object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-700" 
                 />
                 
                 <div className="absolute inset-x-0 bottom-0 p-6 flex gap-3 translate-y-full group-hover:translate-y-0 transition-all duration-500 bg-gradient-to-t from-surface to-transparent backdrop-blur-sm">
                    <button className="btn btn-primary text-[10px] uppercase font-bold tracking-widest flex-1 h-10 shadow-glow">SVG Vector</button>
                    <button className="btn btn-outline text-[10px] uppercase font-bold tracking-widest flex-1 h-10 border-accent/20 text-accent hover:border-accent">HQ Print</button>
                 </div>
             </div>
          </motion.div>

          {/* Colors Row */}
          <motion.div variants={itemVariants} className="lg:col-span-7 flex flex-col gap-6">
             <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-3">
                 <div className="p-2.5 rounded-xl bg-accent/10 text-accent shadow-inner">
                   <Palette size={22} strokeWidth={2.5} />
                 </div>
                 <h3 className="text-2xl font-headline text-primary font-bold">Chromatic palette</h3>
               </div>
               <button className="text-[10px] font-bold text-accent uppercase tracking-widest hover:text-primary transition-colors border-b border-accent/20 pb-1">Edit Palette</button>
             </div>
             
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 h-[280px]">
               {Object.entries(brandData?.colors || {}).map(([name, hex]) => (
                 <div key={name} className="glass-card overflow-hidden group flex flex-col border-none shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                   <div 
                     className="flex-1 w-full transition-transform duration-700 group-hover:scale-110 relative" 
                     style={{ backgroundColor: hex || '#3E2723' }}
                   >
                     <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Copy size={24} className="text-white drop-shadow-md opacity-50" />
                     </div>
                   </div>
                   <div className="p-4 flex justify-between items-center bg-surface border-t border-light/50">
                     <div className="min-w-0 pr-2">
                       <div className="font-ui font-bold text-[9px] uppercase text-muted/60 tracking-[0.15em] mb-0.5 truncate">{name}</div>
                       <div className="font-ui font-black text-xs text-primary tracking-wide">{(hex || '').toUpperCase()}</div>
                     </div>
                     <button 
                       onClick={() => copyToClipboard(hex)}
                       className="p-2 rounded-xl hover:bg-accent/10 text-muted/40 hover:text-accent transition-all shrink-0"
                     >
                       {copiedVar === hex ? <CheckCircle size={16} className="text-green-600" /> : <Copy size={16} />}
                     </button>
                   </div>
                 </div>
               ))}
             </div>
          </motion.div>

          {/* Type Row */}
          <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col gap-6 mt-4">
             <div className="flex items-center gap-3 mb-2 px-2">
               <div className="p-2.5 rounded-xl bg-accent/10 text-accent shadow-inner">
                 <Type size={22} strokeWidth={2.5} />
               </div>
               <h3 className="text-2xl font-headline text-primary font-bold">Typographic Pairing</h3>
             </div>
             
             <div className="glass-card p-10 border-accent/10 flex flex-col md:grid md:grid-cols-12 gap-10 min-h-[340px] bg-surface relative overflow-hidden shadow-xl">
                 <div className="absolute top-0 left-0 w-32 h-32 bg-accent/5 blur-[80px] rounded-full"></div>
                 
                 <div className="md:col-span-4 flex flex-col justify-center gap-10 pr-6 relative z-10">
                    <div className="group cursor-default">
                      <div className="text-accent text-[9px] font-black uppercase tracking-[0.2em] mb-2.5 opacity-60">Headline</div>
                      <div className="font-headline text-3xl text-primary font-bold leading-tight group-hover:text-accent transition-colors">{brandData?.typography?.headline || 'Playfair Display'}</div>
                    </div>
                    <div className="group cursor-default">
                      <div className="text-accent text-[9px] font-black uppercase tracking-[0.2em] mb-2.5 opacity-60">Body Narrative</div>
                      <div className="font-body text-xl text-primary/80 leading-relaxed font-medium">{brandData?.typography?.body || 'Inter'}</div>
                    </div>
                    <div className="group cursor-default">
                      <div className="text-accent text-[9px] font-black uppercase tracking-[0.2em] mb-2.5 opacity-60">Functional Interface</div>
                      <div className="font-ui text-md text-primary/50 tracking-wide font-bold">{brandData?.typography?.ui || 'Satoshi'}</div>
                    </div>
                 </div>
  
                 <div className="md:col-span-8 flex flex-col justify-center bg-secondary/30 p-12 rounded-[2rem] border border-accent/5 backdrop-blur-sm relative group shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.02] to-transparent pointer-events-none"></div>
                    <div className="text-[9px] font-black uppercase tracking-[0.25em] text-accent/60 mb-8 flex items-center gap-2">
                      <div className="w-4 h-px bg-accent/30"></div> Typesetting Specimen
                    </div>
                    <h4 className="font-headline text-6xl mb-8 leading-[1.05] text-primary font-bold tracking-tight">The Art of Essence.</h4>
                    <p className="font-body text-primary/60 leading-[1.8] text-lg max-w-lg font-medium italic">
                      "Design is not just what it looks like and feels like. Design is how it works."
                    </p>
                    <div className="mt-10 flex gap-4">
                       <div className="w-10 h-10 rounded-full border border-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">Aa</div>
                       <div className="flex-1 h-px bg-accent/10 my-auto"></div>
                    </div>
                 </div>
             </div>
          </motion.div>

          {/* Persona Row */}
          <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col gap-6 mt-4">
             <div className="flex items-center gap-3 mb-2 px-2">
               <div className="p-2.5 rounded-xl bg-accent/10 text-accent shadow-inner">
                 <Sparkles size={22} strokeWidth={2.5} />
               </div>
               <h3 className="text-2xl font-headline text-primary font-bold">Brand persona</h3>
             </div>
             
             <div className="glass-card p-10 border-none flex flex-col gap-8 min-h-[340px] bg-primary text-secondary relative overflow-hidden group shadow-[0_20px_40px_rgba(62,39,35,0.15)]">
                <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 blur-[100px] rounded-full -mr-24 -mt-24 group-hover:bg-accent/20 transition-all duration-1000"></div>
                <div className="relative z-10">
                   <div className="text-accent/50 text-[9px] font-black uppercase tracking-[0.2em] mb-4">Master Archetype</div>
                   <div className="text-4xl font-headline font-bold tracking-tight mb-2">{brandData?.brandArchetype || 'The Visionary'}</div>
                </div>
                <div className="w-16 h-0.5 bg-accent/20 relative z-10 mt-2"></div>
                <div className="relative z-10 overflow-hidden">
                   <div className="text-accent/50 text-[9px] font-black uppercase tracking-[0.2em] mb-6">Tone of Voice</div>
                   <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 group/item">
                         <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
                         <span className="text-sm font-bold tracking-wide text-secondary/90 group-hover/item:text-accent transition-colors">Sophisticated & Elite</span>
                      </div>
                      <div className="flex items-center gap-3 group/item">
                         <div className="w-1.5 h-1.5 rounded-full bg-accent/40"></div>
                         <span className="text-sm font-bold tracking-wide text-secondary/70 group-hover/item:text-accent transition-colors">Articulate & Poised</span>
                      </div>
                      <div className="flex items-center gap-3 group/item">
                         <div className="w-1.5 h-1.5 rounded-full bg-accent/40"></div>
                         <span className="text-sm font-bold tracking-wide text-secondary/70 group-hover/item:text-accent transition-colors">Minimalist Elegance</span>
                      </div>
                   </div>
                </div>
                <div className="mt-auto relative z-10">
                  <button className="btn btn-primary w-full py-4 shadow-xl group-hover:shadow-glow transition-all duration-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                    Download brand deck
                  </button>
                </div>
             </div>
          </motion.div>
         
      </div>

      <motion.div variants={itemVariants} className="mt-8">
        <SocialFeedPreview brandData={brandData} />
      </motion.div>

    </motion.div>
  );
};

export default BrandKitPage;
