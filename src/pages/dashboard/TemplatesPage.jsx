import React, { useState, useEffect } from 'react';
import { Download, Play, Layout, Phone, X, Type, Image as ImageIcon, Palette, Copy, Shapes, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateImage } from '../../services/sdxlService';

const TemplatesPage = () => {
  const [filter, setFilter] = useState('all');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBg, setGeneratedBg] = useState(null);
  const [brandData, setBrandData] = useState(null);

  useEffect(() => {
    const savedKit = sessionStorage.getItem('currentBrandKit');
    if (savedKit) {
      try {
        setBrandData(JSON.parse(savedKit));
      } catch (err) {
        console.error('Failed to parse brand kit:', err);
      }
    }
  }, []);

  const handleGenerateBackground = async () => {
    if (!brandData) return;
    setIsGenerating(true);
    
    try {
      const prompt = `A premium ${brandData.vibe || 'minimalist'} ${brandData.niche || 'lifestyle'} lifestyle aesthetic flat-lay background, 
      high quality, artistic photography, soft lighting, using a color palette of ${Object.values(brandData.colors).join(', ')}. 
      No text, no clutter, professional studio lighting.`;
      
      const imageUrl = await generateImage(prompt);
      if (imageUrl) {
        setGeneratedBg(imageUrl);
      }
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const templates = [
    { id: 1, type: 'instagram', title: 'Quote Post', image: 'https://placehold.co/400x500/0F0F0F/F5F5F5?text=QUOTE&font=playfair' },
    { id: 2, type: 'reels', title: 'Reel Cover A', image: 'https://placehold.co/400x700/0F0F0F/C6A96B?text=COVER&font=satoshi' },
    { id: 3, type: 'story', title: 'Story Highlight', image: 'https://placehold.co/400x700/F5F5F5/0F0F0F?text=STORY&font=inter' },
    { id: 4, type: 'instagram', title: 'Carousel Slide 1', image: 'https://placehold.co/400x400/0F0F0F/6B7CFF?text=SLIDE_1&font=playfair' },
    { id: 5, type: 'youtube', title: 'Thumbnail Main', image: 'https://placehold.co/600x338/C6A96B/0F0F0F?text=THUMBNAIL&font=playfair' },
    { id: 6, type: 'reels', title: 'Reel Cover B', image: 'https://placehold.co/400x700/0F0F0F/F5F5F5?text=VLOG&font=satoshi' },
    { id: 7, type: 'instagram', title: 'Announcement', image: 'https://placehold.co/400x400/6B7CFF/0F0F0F?text=NEW&font=playfair' },
    { id: 8, type: 'story', title: 'Q&A Template', image: 'https://placehold.co/400x700/0F0F0F/C6A96B?text=Q%26A&font=satoshi' },
  ];

  const filtered = filter === 'all' ? templates : templates.filter(t => t.type === filter);

  return (
    <div className="animate-fade-in flex flex-col gap-8 w-full max-w-[1200px] mx-auto">
       <div className="flex justify-between items-center border-b border-light pb-0">
          <div className="flex gap-8 w-full overflow-x-auto no-scrollbar">
             <button onClick={() => setFilter('all')} className={`pb-4 border-b-2 -mb-[2px] font-black tracking-widest uppercase text-[10px] px-2 shrink-0 transition-colors ${filter === 'all' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-primary'}`}>All Templates</button>
             <button onClick={() => setFilter('instagram')} className={`pb-4 border-b-2 -mb-[2px] font-black tracking-widest uppercase text-[10px] px-2 flex items-center gap-2 shrink-0 transition-colors ${filter === 'instagram' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-primary'}`}><Layout size={14} /> Instagram</button>
             <button onClick={() => setFilter('reels')} className={`pb-4 border-b-2 -mb-[2px] font-black tracking-widest uppercase text-[10px] px-2 flex items-center gap-2 shrink-0 transition-colors ${filter === 'reels' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-primary'}`}><Play size={14} /> Reels</button>
             <button onClick={() => setFilter('story')} className={`pb-4 border-b-2 -mb-[2px] font-black tracking-widest uppercase text-[10px] px-2 flex items-center gap-2 shrink-0 transition-colors ${filter === 'story' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-primary'}`}><Phone size={14} /> Stories</button>
          </div>
       </div>

       {/* Grid */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
         {filtered.map(template => (
             <motion.div 
               layout
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               transition={{ duration: 0.2 }}
               key={template.id} 
               className="group relative rounded-2xl overflow-hidden border border-light bg-surface hover:border-accent/40 transition-all flex flex-col w-full max-w-[300px] h-[340px] mx-auto shadow-sm hover:shadow-md"
             >
                <div className="flex-1 relative overflow-hidden bg-secondary/50 flex items-center justify-center p-8">
                  <img src={template.image} alt={template.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
                  
                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-primary/95 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 backdrop-blur-md">
                     <button onClick={() => { setEditingTemplate(template); setGeneratedBg(null); }} className="btn btn-primary text-[10px] font-black uppercase tracking-widest w-3/4 shadow-glow flex gap-2 items-center justify-center py-3 h-auto text-secondary">
                       Edit Design
                     </button>
                     <button className="btn btn-outline border-white/20 text-white hover:border-accent hover:text-accent text-[10px] font-black uppercase tracking-widest w-3/4 flex gap-2 items-center justify-center py-3 h-auto">
                       <Copy size={14} /> Duplicate
                     </button>
                     <button className="btn btn-ghost text-muted hover:text-white text-[10px] font-black uppercase tracking-widest w-3/4 flex gap-2 items-center justify-center py-2.5 h-auto mt-2 border-t border-white/10 pt-4">
                       <Download size={14} /> Export
                     </button>
                  </div>
                </div>
                <div className="p-5 bg-surface border-t border-light flex justify-between items-center">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">{template.title}</span>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-muted mt-1">{template.type}</span>
                   </div>
                   <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-accent">
                      <ImageIcon size={14} />
                   </div>
                </div>
             </motion.div>
         ))}
       </div>

       {/* Editor Modal */}
       <AnimatePresence>
         {editingTemplate && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-10 bg-black/95 backdrop-blur-xl"
           >
              <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full h-full xl:max-w-[1500px] xl:max-h-[900px] bg-secondary border border-light rounded-none md:rounded-3xl flex flex-col md:flex-row overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] relative"
              >
                 
                 {/* Left Sidebar */}
                 <div className="w-16 md:w-20 lg:w-[280px] border-r border-light bg-surface flex flex-col shrink-0 z-20 pt-16 md:pt-0">
                    <div className="h-[80px] hidden md:flex border-b border-light items-center justify-center lg:justify-start px-0 lg:px-8 shrink-0">
                       <span className="hidden lg:block font-headline text-2xl font-bold text-primary">Vogue Assets</span>
                    </div>

                    <div className="flex-1 overflow-y-auto py-8">
                       <div className="flex flex-col gap-4 px-2 lg:px-4">
                          {[
                            { icon: <Type size={22} />, label: 'Typography' },
                            { icon: <ImageIcon size={22} />, label: 'Media Library' },
                            { icon: <Shapes size={22} />, label: 'Geometric elements' },
                            { icon: <Palette size={22} />, label: 'Brand Palette' },
                          ].map((item, idx) => (
                             <button key={idx} className="flex flex-col lg:flex-row items-center gap-1 lg:gap-5 p-5 rounded-2xl hover:bg-black/5 transition-all border border-transparent hover:border-light text-primary w-full text-center lg:text-left group">
                                <div className="text-accent group-hover:scale-110 transition-transform">{item.icon}</div>
                                <span className="font-black text-[10px] lg:text-[11px] uppercase tracking-widest mt-1 lg:mt-0 opacity-70 lg:opacity-100">{item.label}</span>
                             </button>
                          ))}
                          
                          <div className="mt-10 border-t border-light pt-10">
                             <button 
                                onClick={handleGenerateBackground}
                                disabled={isGenerating}
                                className={`flex flex-col lg:flex-row items-center gap-5 p-6 rounded-3xl border transition-all w-full text-center lg:text-left ${
                                   isGenerating ? 'bg-accent/5 border-accent/20 cursor-not-allowed shadow-inner' : 'bg-accent/10 border-accent/20 hover:bg-accent/20 text-accent group shadow-md'
                                }`}
                             >
                                {isGenerating ? <Loader2 size={28} className="animate-spin text-accent" /> : <Wand2 size={28} className="group-hover:rotate-12 transition-transform" />}
                                <div className="flex flex-col text-left">
                                   <span className="font-black text-[11px] uppercase tracking-widest">{isGenerating ? 'Dreaming...' : 'AI Essence'}</span>
                                   <span className="text-[10px] opacity-70 hidden lg:block font-medium mt-1">Generate magic background</span>
                                </div>
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Center Canvas */}
                 <div className="flex-1 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-[#0A0A0A] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-[80px] bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between px-10 z-20 pointer-events-none">
                       <div className="pointer-events-auto">
                          <span className="font-black text-[10px] tracking-widest uppercase text-muted bg-primary/40 px-4 py-2 rounded-full border border-white/10 backdrop-blur-xl">Cloud Synced</span>
                       </div>
                    </div>

                    <div className="absolute inset-0 bg-black/40 mix-blend-overlay pointer-events-none"></div>
                    
                    <div className="flex-1 flex items-center justify-center p-10 lg:p-20 relative overflow-auto pt-24 md:pt-10">
                       <div className="relative w-full max-w-[50vh] lg:max-w-[70vh] aspect-[4/5] bg-primary shadow-[0_0_150px_rgba(0,0,0,0.8)] border border-white/5 group">
                         <AnimatePresence>
                           {isGenerating && (
                             <motion.div 
                               initial={{ opacity: 0 }}
                               animate={{ opacity: 1 }}
                               exit={{ opacity: 0 }}
                               className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-6"
                             >
                                <Loader2 className="w-16 h-16 text-accent animate-spin" />
                                <span className="text-white font-black text-[12px] tracking-[0.3em] uppercase animate-pulse">Capturing Infinite Essence...</span>
                             </motion.div>
                           )}
                         </AnimatePresence>

                         <div className="absolute -inset-10 bg-gradient-to-br from-accent/30 to-highlight/30 opacity-0 group-hover:opacity-40 blur-[80px] transition-opacity duration-1000 -z-10 pointer-events-none"></div>
                         
                         <img 
                            src={generatedBg || editingTemplate.image.replace('400x500', '1080x1080').replace('400x700', '1080x1920')} 
                            alt="Canvas" 
                            className={`w-full h-full object-cover transition-opacity duration-1000 ${isGenerating ? 'opacity-20' : 'opacity-100'}`} 
                         />
                         
                         <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-16 pointer-events-none">
                            <h3 className="text-white font-headline text-5xl md:text-7xl uppercase tracking-tighter leading-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] mb-6" 
                                style={{ fontFamily: brandData?.typography?.headline || 'inherit' }}>
                                Pure<br/>Elegance
                            </h3>
                            <div className="w-20 h-1.5 bg-accent rounded-full mb-8 shadow-glow"></div>
                            <p className="text-white/90 font-body text-base md:text-lg max-w-sm font-medium tracking-wide drop-shadow-md" 
                               style={{ fontFamily: brandData?.typography?.body || 'inherit' }}>
                               Sophistication is the ultimate expression of simplicity.
                            </p>
                         </div>

                         <div className="absolute inset-8 border border-white/10 z-0 pointer-events-none"></div>
                       </div>
                    </div>
                 </div>

                 {/* Right Sidebar */}
                 <div className="hidden md:flex w-[340px] border-l border-light bg-surface flex-col shrink-0 z-20">
                    <div className="h-[80px] border-b border-light flex items-center justify-between px-8 shrink-0 gap-4">
                       <button className="btn btn-primary h-12 flex-1 text-[11px] font-black uppercase tracking-widest shadow-glow flex items-center justify-center gap-3 text-secondary">
                          <Download size={18} /> Deploy Asset
                       </button>
                       <button onClick={() => setEditingTemplate(null)} className="p-2.5 text-muted hover:text-primary rounded-2xl hover:bg-black/5 transition-colors flex-shrink-0 border border-transparent hover:border-light">
                          <X size={24} />
                       </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-10">
                       <div className="p-5 rounded-2xl bg-accent/5 border border-accent/10 shadow-sm">
                          <div className="flex items-center gap-3 mb-3 text-accent">
                             <Sparkles size={18} />
                             <span className="text-[11px] font-black uppercase tracking-widest">Brand Aligned</span>
                          </div>
                          <p className="text-[11px] text-muted leading-relaxed font-medium">
                             Synchronized with your <strong>{brandData?.typography?.headline}</strong> signature and premium palette.
                          </p>
                       </div>

                       <div className="flex flex-col gap-6">
                          <h4 className="text-[11px] font-black uppercase tracking-widest text-muted">Typography Settings</h4>
                          <div className="flex flex-col gap-3">
                             <label className="text-[10px] uppercase tracking-widest font-black text-muted/60 ml-1">Font Family</label>
                             <select className="input h-12 text-sm bg-secondary border-light text-primary py-0 w-full focus:border-accent font-bold shadow-sm">
                                <option>{brandData?.typography?.headline || 'Playfair Display'}</option>
                                <option>{brandData?.typography?.body || 'Inter'}</option>
                                <option>{brandData?.typography?.ui || 'Satoshi'}</option>
                             </select>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                             <div className="flex flex-col gap-3">
                                <label className="text-[10px] uppercase tracking-widest font-black text-muted/60 ml-1">Magnitude</label>
                                <div className="flex items-center bg-secondary border border-light rounded-xl overflow-hidden focus-within:border-accent shadow-sm">
                                   <input type="number" defaultValue={72} className="w-full bg-transparent border-none text-primary text-sm px-4 py-3 outline-none font-bold" />
                                </div>
                             </div>
                             <div className="flex flex-col gap-3">
                                <label className="text-[10px] uppercase tracking-widest font-black text-muted/60 ml-1">Presence</label>
                                <div className="flex items-center gap-3 bg-secondary border border-light rounded-xl p-3 cursor-pointer border-accent shadow-sm">
                                   <div className="w-6 h-6 rounded-md shadow-inner border border-black/10" style={{ backgroundColor: brandData?.colors?.accent || '#C6A96B' }}></div>
                                   <span className="text-xs font-black uppercase text-primary">{brandData?.colors?.accent || '#C6A96B'}</span>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="flex flex-col gap-6">
                          <h4 className="text-[11px] font-black uppercase tracking-widest text-muted">Quick Aesthetics</h4>
                          <div className="grid grid-cols-2 gap-3">
                             <button className="px-4 py-3 rounded-xl bg-secondary border border-light text-[10px] font-black uppercase tracking-widest hover:border-accent transition-all shadow-sm">Invert Focus</button>
                             <button className="px-4 py-3 rounded-xl bg-secondary border border-light text-[10px] font-black uppercase tracking-widest hover:border-accent transition-all shadow-sm">Minimalist</button>
                             <button className="px-4 py-3 rounded-xl bg-secondary border border-light text-[10px] font-black uppercase tracking-widest hover:border-accent transition-all col-span-2 shadow-sm">Restore Brand Sync</button>
                          </div>
                       </div>
                    </div>
                 </div>
                 
                 <button 
                   onClick={() => setEditingTemplate(null)} 
                   className="absolute top-6 right-6 md:hidden z-[70] p-4 bg-black/90 rounded-full text-white backdrop-blur-xl shadow-2xl border border-white/10"
                 >
                   <X size={24} />
                 </button>

              </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
};

export default TemplatesPage;
