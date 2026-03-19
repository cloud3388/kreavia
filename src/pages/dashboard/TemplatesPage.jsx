import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, Layout, X, Type, Image as ImageIcon, Palette, Copy, Shapes, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateImage } from '../../services/nvidiaService';
import TemplateRenderer from '../../components/dashboard/TemplateRenderer';

const DEFAULT_BRAND = {
  brandName: 'Kreavia',
  brandArchetype: 'The Visionary',
  colors: { primary: '#1A1A1A', accent: '#C6A96B', highlight: '#F5F5F7', secondary: '#FBFBFD' },
  typography: { headline: 'Playfair Display', body: 'Inter', ui: 'Satoshi' },
  logos: [],
};

const TemplatesPage = () => {
  const [filter, setFilter] = useState('all');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBg, setGeneratedBg] = useState(null);
  const [brandData, setBrandData] = useState(DEFAULT_BRAND);
  const [localBrandData, setLocalBrandData] = useState(DEFAULT_BRAND);
  const [localText, setLocalText] = useState('');

  useEffect(() => {
    const savedKit = sessionStorage.getItem('currentBrandKit');
    if (savedKit) {
      try {
        const parsed = JSON.parse(savedKit);
        setBrandData({ ...DEFAULT_BRAND, ...parsed, colors: { ...DEFAULT_BRAND.colors, ...(parsed.colors || {}) }, typography: { ...DEFAULT_BRAND.typography, ...(parsed.typography || {}) } });
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
    { id: 1, type: 'instagram', title: 'Quote Post', renderType: 'quote', text: 'Elegance is the only beauty that never fades.' },
    { id: 2, type: 'reels', title: 'Reel Cover A', renderType: 'reel_cover', text: 'CREATING THE FUTURE' },
    { id: 3, type: 'story', title: 'Story Highlight', renderType: 'story', text: 'VIBE CHECK' },
    { id: 4, type: 'instagram', title: 'Carousel Slide 1', renderType: 'carousel', text: '3 Tips for Minimalist Living' },
    { id: 5, type: 'reels', title: 'Reel Cover B', renderType: 'reel_cover', text: 'A DAY IN THE LIFE' },
    { id: 6, type: 'instagram', title: 'Announcement', renderType: 'quote', text: 'BIG THINGS COMING SOON' },
    { id: 7, type: 'story', title: 'Q&A Template', renderType: 'story', text: 'ASK ANYTHING' },
    { id: 8, type: 'instagram', title: 'Tip of the Day', renderType: 'carousel', text: 'How to Build Consistency' },
  ];

  const filtered = filter === 'all' ? templates : templates.filter(t => t.type === filter);

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto pb-20">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-headline font-bold text-primary mb-2">Editorial Templates</h2>
            <p className="text-muted text-sm font-medium">Fully customizable layouts synchronized with your brand DNA.</p>
          </div>
          <div className="flex gap-4 p-1 bg-surface border border-light rounded-2xl w-max shadow-sm">
             {['all', 'instagram', 'reels', 'story'].map(f => (
               <button 
                 key={f}
                 onClick={() => setFilter(f)} 
                 className={`px-6 py-2.5 rounded-xl font-black tracking-widest uppercase text-[10px] transition-all ${filter === f ? 'bg-accent text-white shadow-glow' : 'text-muted hover:text-primary hover:bg-black/5'}`}
               >
                 {f === 'all' ? 'All' : f}
               </button>
             ))}
          </div>
       </div>

       {/* Grid */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
         {filtered.length > 0 ? filtered.map(template => (
             <motion.div 
               layout
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               key={template.id} 
               className="group relative rounded-3xl overflow-hidden border border-light bg-surface hover:border-accent/40 transition-all flex flex-col w-full h-[450px] shadow-sm hover:shadow-xl hover:-translate-y-1"
             >
                <div className="flex-1 relative overflow-hidden bg-highlight/30 flex items-center justify-center p-8">
                   <div className="w-full h-full shadow-2xl rounded-lg overflow-hidden scale-[0.85] group-hover:scale-100 transition-transform duration-700 origin-center">
                      <TemplateRenderer 
                        type={template.renderType} 
                        brandData={brandData} 
                        text={template.text} 
                      />
                   </div>
                   
                   {/* Hover Actions */}
                   <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-4 backdrop-blur-md">
                      <button onClick={() => { 
                        setEditingTemplate(template); 
                        setGeneratedBg(null); 
                        setLocalBrandData(brandData);
                        setLocalText(template.text);
                      }} className="btn btn-primary text-[10px] font-black uppercase tracking-widest w-2/3 h-12 shadow-glow flex gap-2 items-center justify-center text-secondary">
                        <Palette size={14} /> Open Editor
                      </button>
                      <button className="btn btn-outline border-primary/20 text-primary hover:border-accent hover:text-accent text-[10px] font-black uppercase tracking-widest w-2/3 h-12 flex gap-2 items-center justify-center">
                        <Copy size={14} /> Duplicate
                      </button>
                   </div>
                </div>
                <div className="p-6 bg-surface border-t border-light/50 flex justify-between items-center group-hover:bg-accent/5 transition-colors">
                   <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase tracking-widest text-primary truncate max-w-[140px]">{template.title}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-accent mt-1 opacity-60">{template.type}</span>
                   </div>
                   <div className="w-10 h-10 rounded-xl bg-white shadow-inner flex items-center justify-center text-accent border border-light/30">
                      <Download size={16} />
                   </div>
                </div>
             </motion.div>
         )) : (
            <div className="col-span-full py-20 text-center flex flex-col items-center gap-6">
               <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                 <Layout size={40} />
               </div>
               <div className="max-w-md">
                 <h3 className="text-2xl font-headline font-bold mb-2">No templates found</h3>
                 <p className="text-muted">Try adjusting your filters or complete the onboarding to generate custom templates.</p>
               </div>
            </div>
         )}
       </div>

       {/* Editor Modal */}
       {createPortal(
         <AnimatePresence>
           {editingTemplate && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-10 bg-black/90 backdrop-blur-xl"
             >
              <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full h-full xl:max-w-[1500px] xl:max-h-[900px] bg-secondary border border-light rounded-none md:rounded-3xl flex flex-col md:flex-row overflow-hidden shadow-2xl relative"
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
                 <div className="flex-1 bg-highlight/50 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-[80px] flex items-center justify-between px-10 z-20 pointer-events-none">
                       <div className="pointer-events-auto mt-10">
                          <span className="font-black text-[10px] tracking-widest uppercase text-muted bg-surface/80 px-4 py-2 rounded-full border border-light backdrop-blur-xl shadow-sm">Cloud Synced</span>
                       </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center p-10 lg:p-20 relative overflow-auto pt-24 md:pt-10">
                       <div className="relative w-full max-w-[50vh] lg:max-w-[70vh] aspect-[4/5] bg-white shadow-2xl border border-light group overflow-hidden rounded-xl">
                         <AnimatePresence>
                           {isGenerating && (
                             <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-6"
                             >
                                <Loader2 className="w-16 h-16 text-accent animate-spin" />
                                <span className="text-secondary font-black text-[12px] tracking-[0.3em] uppercase animate-pulse">Capturing Infinite Essence...</span>
                             </motion.div>
                           )}
                         </AnimatePresence>

                         <div className="w-full h-full relative">
                            {generatedBg ? (
                                <img src={generatedBg} alt="AI Generated" className="w-full h-full object-cover" />
                            ) : (
                                <TemplateRenderer 
                                    type={editingTemplate.renderType} 
                                    brandData={localBrandData} 
                                    text={localText} 
                                />
                            )}
                         </div>
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
                             <select 
                                value={localBrandData.typography?.headline || 'Playfair Display'}
                                onChange={(e) => setLocalBrandData({...localBrandData, typography: {...localBrandData.typography, headline: e.target.value}})}
                                className="input h-12 text-sm bg-secondary border-light text-primary py-0 w-full focus:border-accent font-bold shadow-sm"
                             >
                                <option value="Playfair Display">Playfair Display</option>
                                <option value="Inter">Inter</option>
                                <option value="Satoshi">Satoshi</option>
                             </select>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                             <div className="flex flex-col gap-3">
                                <label className="text-[10px] uppercase tracking-widest font-black text-muted/60 ml-1">Content</label>
                                <div className="flex items-start bg-secondary border border-light rounded-xl overflow-hidden focus-within:border-accent shadow-sm">
                                   <textarea 
                                     value={localText}
                                     onChange={(e) => setLocalText(e.target.value)}
                                     rows={3}
                                     className="w-full bg-transparent border-none text-primary text-sm px-4 py-3 outline-none font-bold resize-none custom-scrollbar" 
                                   />
                                </div>
                             </div>
                             <div className="flex flex-col gap-3">
                                <label className="text-[10px] uppercase tracking-widest font-black text-muted/60 ml-1">Presence</label>
                                <label className="flex items-center gap-3 bg-secondary border border-light rounded-xl p-3 cursor-pointer border-accent shadow-sm">
                                   <input 
                                     type="color" 
                                     value={localBrandData.colors?.accent || '#C6A96B'}
                                     onChange={(e) => setLocalBrandData({...localBrandData, colors: {...localBrandData.colors, accent: e.target.value}})}
                                     className="sr-only"
                                   />
                                   <div className="w-6 h-6 rounded-md shadow-inner border border-black/10" style={{ backgroundColor: localBrandData.colors?.accent || '#C6A96B' }}></div>
                                   <span className="text-xs font-black uppercase text-primary text-ellipsis overflow-hidden whitespace-nowrap">{localBrandData.colors?.accent || '#C6A96B'}</span>
                                </label>
                             </div>
                          </div>
                       </div>

                       <div className="flex flex-col gap-6">
                          <h4 className="text-[11px] font-black uppercase tracking-widest text-muted">Quick Aesthetics</h4>
                          <div className="grid grid-cols-2 gap-3">
                             <button onClick={() => setLocalBrandData({...localBrandData, colors: {...localBrandData.colors, primary: localBrandData.colors?.highlight || '#F5F5F7', highlight: localBrandData.colors?.primary || '#1A1A1A'}})} className="px-4 py-3 rounded-xl bg-secondary border border-light text-[10px] font-black uppercase tracking-widest hover:border-accent transition-all shadow-sm">Invert Focus</button>
                             <button onClick={() => setLocalBrandData({...localBrandData, colors: {...localBrandData.colors, primary: '#000000', accent: '#000000', highlight: '#F1F1F1', secondary: '#FFFFFF'}})} className="px-4 py-3 rounded-xl bg-secondary border border-light text-[10px] font-black uppercase tracking-widest hover:border-accent transition-all shadow-sm">Minimalist</button>
                             <button onClick={() => { setLocalBrandData(brandData); setLocalText(editingTemplate.text); }} className="px-4 py-3 rounded-xl bg-secondary border border-light text-[10px] font-black uppercase tracking-widest hover:border-accent transition-all col-span-2 shadow-sm">Restore Brand Sync</button>
                          </div>
                       </div>
                    </div>
                 </div>
                 
                 <button 
                   onClick={() => setEditingTemplate(null)} 
                   className="absolute top-6 right-6 md:hidden z-[70] p-4 bg-surface/90 rounded-full text-primary backdrop-blur-xl shadow-2xl border border-light"
                 >
                   <X size={24} />
                 </button>

              </motion.div>
             </motion.div>
           )}
         </AnimatePresence>,
         document.body
       )}
    </div>
  );
};

export default TemplatesPage;
