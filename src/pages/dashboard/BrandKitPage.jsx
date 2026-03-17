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

  return (
    <div className="animate-fade-in flex flex-col gap-12 max-w-6xl pb-24">
      
      {/* Overview Card */}
      <div className="glass-card p-10 flex justify-between items-center border-accent/20 bg-surface relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <h3 className="text-accent text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
            <Sparkles size={14} /> Brand Archetype
          </h3>
          <div className="text-4xl font-headline text-primary font-bold">{brandData?.brandArchetype || 'The Visionary'}</div>
        </div>
        <div className="text-right relative z-10">
           <div className="text-muted text-xs font-bold uppercase tracking-widest mb-1">Brand Score</div>
           <div className="text-6xl font-ui font-black text-primary/10 group-hover:text-accent/20 transition-colors duration-500 absolute -top-4 -right-2">
             {brandData?.brandScore || 85}
           </div>
           <div className="text-5xl font-ui font-bold text-primary">{brandData?.brandScore || 85}</div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         
          {/* Top Row */}
          <div className="lg:col-span-5 flex flex-col gap-6">
             <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-accent/10 text-accent">
                   <ImageIcon size={20} />
                 </div>
                 <h3 className="text-2xl font-headline text-primary">Logos</h3>
               </div>
               <button className="text-sm font-bold text-accent hover:text-primary transition-colors">Regenerate</button>
             </div>
             
             {/* Primary Logo Card - 420x260 */}
             <div className="glass-card flex flex-col items-center justify-center relative group overflow-hidden border-light h-[260px] bg-white">
                 <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <img src={brandData?.logos?.[0]?.url || "https://placehold.co/400x400/3E2723/FDF8F1?text=Logo"} alt="Primary Logo" className="w-32 h-32 object-contain group-hover:scale-110 transition-transform duration-500" />
                 
                 {/* Actions overlay */}
                 <div className="absolute inset-x-0 bottom-0 p-4 flex gap-2 translate-y-full group-hover:translate-y-0 transition-transform bg-gradient-to-t from-surface to-transparent">
                    <button className="btn btn-primary text-xs flex-1">Download PNG</button>
                    <button className="btn btn-outline text-xs flex-1 border-accent/20 text-accent hover:border-accent">Download SVG</button>
                 </div>
             </div>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-6">
             <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-accent/10 text-accent">
                   <Palette size={20} />
                 </div>
                 <h3 className="text-2xl font-headline text-primary">Color Palette</h3>
               </div>
               <button className="text-sm font-bold text-accent hover:text-primary transition-colors">Export Palette</button>
             </div>
             
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 h-[260px]">
               {Object.entries(brandData?.colors || {}).map(([name, hex]) => (
                 <div key={name} className="glass-card overflow-hidden group flex flex-col border-none shadow-sm hover:shadow-md">
                   <div 
                     className="flex-1 w-full transition-transform duration-500 group-hover:scale-110" 
                     style={{ backgroundColor: hex || '#3E2723' }}
                   />
                   <div className="p-3 flex justify-between items-center bg-surface border-t border-light">
                     <div>
                       <div className="font-ui font-bold text-[10px] uppercase text-muted tracking-widest mb-0.5">{name}</div>
                       <div className="font-ui font-black text-xs text-primary tracking-wide">{(hex || '').toUpperCase()}</div>
                     </div>
                     <button 
                       onClick={() => copyToClipboard(hex)}
                       className="p-1.5 rounded-lg hover:bg-accent/10 text-muted hover:text-accent transition-all"
                     >
                       {copiedVar === hex ? <CheckCircle size={14} className="text-green-600" /> : <Copy size={14} />}
                     </button>
                   </div>
                 </div>
               ))}
             </div>
          </div>

          {/* Bottom Row */}
          <div className="lg:col-span-8 flex flex-col gap-6 mt-4">
             <div className="flex items-center gap-3 mb-2">
               <div className="p-2 rounded-lg bg-accent/10 text-accent">
                 <Type size={20} />
               </div>
               <h3 className="text-2xl font-headline text-primary">Font Pairing</h3>
             </div>
             
             <div className="glass-card p-10 border-light flex flex-col md:flex-row gap-8 min-h-[300px] bg-surface">
                 <div className="flex-1 flex flex-col justify-center gap-8 pr-10 md:border-r border-accent/10">
                   <div>
                     <div className="text-accent text-[10px] font-bold uppercase tracking-widest mb-2">Headline</div>
                     <div className="font-headline text-4xl text-primary font-bold">{brandData?.typography?.headline || 'Playfair Display'}</div>
                   </div>
                   <div>
                     <div className="text-accent text-[10px] font-bold uppercase tracking-widest mb-2">Body Text</div>
                     <div className="font-body text-xl text-primary/80">{brandData?.typography?.body || 'Inter'}</div>
                   </div>
                   <div>
                     <div className="text-accent text-[10px] font-bold uppercase tracking-widest mb-2">UI Accent</div>
                     <div className="font-ui text-lg text-primary/60 italic">{brandData?.typography?.ui || 'Satoshi'}</div>
                   </div>
                </div>
 
                <div className="flex-[1.8] flex flex-col justify-center bg-secondary/50 p-10 rounded-2xl border border-accent/5">
                   <div className="text-[10px] font-bold uppercase tracking-widest text-accent mb-6">Live Mockup</div>
                   <h4 className="font-headline text-5xl mb-6 leading-[1.1] text-primary font-bold">The Art of<br/>Craftsmanship</h4>
                   <p className="font-body text-primary/70 leading-relaxed text-lg max-w-md">Experience a minimalist approach to luxury branding, where every detail is curated for the modern visionary.</p>
                </div>
             </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6 mt-4">
             <div className="flex items-center gap-3 mb-2">
               <div className="p-2 rounded-lg bg-accent/10 text-accent">
                 <Sparkles size={20} />
               </div>
               <h3 className="text-2xl font-headline text-primary">Brand Persona</h3>
             </div>
             
             <div className="glass-card p-10 border-light flex flex-col gap-8 min-h-[300px] bg-primary text-secondary relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-accent/30 transition-colors"></div>
                <div className="relative z-10">
                   <div className="text-accent/60 text-[10px] font-bold uppercase tracking-widest mb-3">Core Archetype</div>
                   <div className="text-3xl font-headline font-bold">{brandData?.brandArchetype || 'The Visionary'}</div>
                </div>
                <div className="w-12 h-0.5 bg-accent/30 relative z-10"></div>
                <div className="relative z-10">
                   <div className="text-accent/60 text-[10px] font-bold uppercase tracking-widest mb-4">Voice Profile</div>
                   <div className="flex flex-wrap gap-2">
                      <span className="px-4 py-1.5 rounded-full border border-accent/20 text-xs font-bold bg-white/5 text-accent">Sophisticated</span>
                      <span className="px-4 py-1.5 rounded-full border border-accent/20 text-xs font-bold bg-white/5 text-accent">Articulate</span>
                      <span className="px-4 py-1.5 rounded-full border border-accent/20 text-xs font-bold bg-white/5 text-accent">Elite</span>
                   </div>
                </div>
                <div className="mt-auto relative z-10">
                  <button className="btn btn-primary w-full py-3 shadow-lg group-hover:shadow-glow transition-all">Export Brand Deck</button>
                </div>
             </div>
          </div>
         
      </div>

      <div className="mt-8">
        <SocialFeedPreview brandData={brandData} />
      </div>

    </div>
  );
};

export default BrandKitPage;
