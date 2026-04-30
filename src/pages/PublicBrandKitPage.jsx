import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Palette, Type, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const PublicBrandKitPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [brandData, setBrandData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Read the Base64 payload from the URL hash
    try {
      const hashContent = window.location.hash.replace('#payload=', '');
      if (!hashContent) {
        throw new Error("No brand payload found in the URL.");
      }
      
      const decodedStr = atob(decodeURIComponent(hashContent));
      const parsedData = JSON.parse(decodedStr);
      setBrandData(parsedData);
    } catch (err) {
      console.error("Failed to decode public brand kit:", err);
      setError("This brand link is invalid or corrupted.");
    }
  }, []);

  // 2. Dynamically load the correct Google Fonts into the DOM
  useEffect(() => {
    if (brandData?.typography) {
      const { headline, body, ui } = brandData.typography;
      const fontsToLoad = [headline, body, ui]
        .filter(Boolean)
        .map(f => f.replace(/\s+/g, '+'));
      
      const uniqueFonts = [...new Set(fontsToLoad)];
      if (uniqueFonts.length > 0) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        const familyParams = uniqueFonts.map(f => `family=${f}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500`).join('&');
        link.href = `https://fonts.googleapis.com/css2?${familyParams}&display=swap`;
        document.head.appendChild(link);
        return () => {
          if (document.head.contains(link)) {
            document.head.removeChild(link);
          }
        };
      }
    }
  }, [brandData?.typography]);

  if (error) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-6">
          <AlertCircle size={48} className="text-red-500/50" />
          <div>
             <h1 className="text-2xl font-headline font-bold mb-2">Brand Not Found</h1>
             <p className="text-muted">{error}</p>
          </div>
          <button onClick={() => navigate('/')} className="btn btn-primary mt-4">Go to Kreavia.ai</button>
        </div>
      </div>
    );
  }

  if (!brandData) return null; // Brief flash while parsing

  const brandName = brandData?.dna?.brand_name || slug.replace(/-/g, ' ');

  return (
    <div className="min-h-screen bg-background text-primary selection:bg-accent/30 selection:text-white flex flex-col items-center pb-32">
       
       {/* Top Nav / Logo bar */}
       <header className="w-full max-w-5xl py-12 px-6 flex justify-between items-center z-10">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-accent/80">
            Brand Presentation
          </div>
          <a href="/" className="text-[10px] font-bold uppercase tracking-widest text-muted hover:text-primary transition-colors">
            Powered by Kreavia.ai
          </a>
       </header>

       <main className="w-full max-w-5xl px-6 flex flex-col gap-16">
          
          {/* Header & Main Logo */}
          <section className="flex flex-col items-center gap-8 text-center pt-8 pb-12">
            <h1 className="text-6xl md:text-8xl font-headline font-black tracking-tight mb-2">
              {brandName}
            </h1>
            <p className="text-lg md:text-xl text-primary/60 max-w-2xl leading-relaxed italic font-medium">
              "{brandData?.dna?.brief || `A ${brandData?.dna?.style} brand built for the ${brandData?.dna?.niche} space.`}"
            </p>

            <div className="mt-12 glass-card p-16 rounded-[3rem] bg-white border-light/50 shadow-2xl relative group overflow-hidden w-full max-w-md aspect-square flex items-center justify-center">
               <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-duration-700"></div>
               {brandData.logos?.[0]?.url && (
                 <img 
                   src={brandData.logos[0].url} 
                   alt={`${brandName} Logo`}
                   className="w-full h-full object-contain mix-blend-multiply drop-shadow-2xl transition-transform duration-700 group-hover:scale-105"
                 />
               )}
            </div>
          </section>

          {/* Color Palette */}
          <section className="flex flex-col gap-8 w-full">
             <div className="flex items-center gap-3">
               <div className="p-3 rounded-2xl bg-accent/10 text-accent">
                 <Palette size={24} />
               </div>
               <h2 className="text-3xl font-headline font-bold">Brand Colors</h2>
             </div>
             
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-[240px]">
               {Object.entries(brandData.colors || {}).map(([name, hex]) => (
                 <div key={name} className="glass-card overflow-hidden flex flex-col shadow-lg border-white/5 rounded-3xl">
                   <div className="flex-1 w-full" style={{ backgroundColor: hex }}></div>
                   <div className="p-5 bg-surface border-t border-white/5 flex justify-between items-center">
                     <div>
                       <div className="font-ui font-bold text-[10px] uppercase text-muted tracking-widest mb-1">{name}</div>
                       <div className="font-ui font-black text-sm">{hex.toUpperCase()}</div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          </section>

          {/* Typography */}
          <section className="flex flex-col gap-8 w-full">
             <div className="flex items-center gap-3">
               <div className="p-3 rounded-2xl bg-accent/10 text-accent">
                 <Type size={24} />
               </div>
               <h2 className="text-3xl font-headline font-bold">Typography</h2>
             </div>

             <div className="glass-card shadow-2xl border-white/5 rounded-[3rem] p-10 md:p-16 flex flex-col md:grid md:grid-cols-12 gap-12 bg-surface overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="md:col-span-4 flex flex-col gap-10 justify-center">
                   <div>
                     <div className="text-accent text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">Headline</div>
                     <div className="text-3xl font-bold">{brandData?.typography?.headline}</div>
                   </div>
                   <div>
                     <div className="text-accent text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">Body</div>
                     <div className="text-xl font-medium text-primary/80">{brandData?.typography?.body}</div>
                   </div>
                   <div>
                     <div className="text-accent text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">Interface</div>
                     <div className="text-lg font-bold text-primary/50">{brandData?.typography?.ui}</div>
                   </div>
                </div>

                <div className="md:col-span-8 bg-secondary/30 p-10 md:p-14 rounded-[2rem] border border-white/10 shadow-inner relative">
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-accent/60 mb-10 flex items-center gap-2">
                      <div className="w-6 h-px bg-accent/30"></div> Specimen
                    </div>
                    
                    <h4 
                      className="text-5xl md:text-7xl mb-8 leading-[1.05] font-bold tracking-tight"
                      style={{ fontFamily: brandData?.typography?.headline }}
                    >
                      The Art of Essence
                    </h4>
                    
                    <p 
                      className="text-primary/70 leading-[1.8] text-xl max-w-lg font-medium mb-12"
                      style={{ fontFamily: brandData?.typography?.body }}
                    >
                      Your brand story begins here. Every detail crafted with intention.
                    </p>

                    <div 
                      className="inline-block px-10 py-5 bg-primary text-secondary rounded-full tracking-widest font-bold text-[12px] shadow-2xl"
                      style={{ fontFamily: brandData?.typography?.ui }}
                    >
                      BUTTON TEXT / NAV LINK
                    </div>
                </div>
             </div>
          </section>

          {/* Persona */}
          <section className="flex flex-col gap-8 w-full mt-8">
             <div className="flex items-center gap-3">
               <div className="p-3 rounded-2xl bg-accent/10 text-accent">
                 <Sparkles size={24} />
               </div>
               <h2 className="text-3xl font-headline font-bold">Brand Persona</h2>
             </div>

             <div className="p-12 md:p-16 rounded-[3rem] overflow-hidden relative shadow-2xl border border-white/10" style={{ background: '#0F0F0F', color: '#FFFFFF' }}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="relative z-10">
                   <div className="text-accent text-[10px] font-black uppercase tracking-widest mb-4">Archetype</div>
                   <div className="text-5xl md:text-6xl font-headline font-bold tracking-tight mb-8">
                     {brandData?.brandArchetype || 'The Visionary'}
                   </div>
                   <div className="w-24 h-px bg-white/20 mb-8"></div>
                   
                   <div className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-6">Tone of Voice</div>
                   <div className="flex flex-wrap gap-4">
                      {(brandData?.brandVoice || 'Sophisticated, Minimal, Confident').split(',').map((tone, idx) => (
                        <div key={idx} className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-sm font-bold tracking-wide">
                          {tone.trim()}
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </section>

       </main>

       {/* Sticky CTA Bottom */}
       <motion.div 
         initial={{ y: 100, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         viewport={{ once: true }}
         transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
         className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
       >
         <button 
           onClick={() => navigate('/onboarding')}
           className="btn btn-primary w-full h-16 shadow-[0_20px_40px_-10px_rgba(198,169,107,0.5)] flex items-center justify-center gap-3 font-bold text-[13px] tracking-widest uppercase rounded-full hover:scale-105 transition-transform"
         >
           Create your free brand kit <ArrowRight size={18} />
         </button>
       </motion.div>

    </div>
  );
};

export default PublicBrandKitPage;
