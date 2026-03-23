import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, Layout, X, Type, Image as ImageIcon, Palette, Copy, Shapes, Sparkles, Loader2, Wand2, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateImage } from '../../services/nvidiaService';
import TemplateRenderer from '../../components/dashboard/TemplateRenderer';
import html2canvas from 'html2canvas';

const DEFAULT_BRAND = {
  brandName: 'Kreavia',
  brandArchetype: 'The Visionary',
  colors: { primary: '#1A1A1A', accent: '#C6A96B', highlight: '#F5F5F7', secondary: '#FBFBFD' },
  typography: { headline: 'Playfair Display', body: 'Inter', ui: 'Satoshi' },
  logos: [],
};

const PRESET_TEMPLATES = [
  { id: 1, type: 'quote', name: 'Visionary Quote 01', text: 'The ultimate expression of simplicity is sophistication.' },
  { id: 2, type: 'reel_cover', name: 'Premium Reel Cover', text: 'THE ART OF CREATION' },
  { id: 3, type: 'story', name: 'Resource Highlight', text: 'RESOURCES' },
  { id: 4, type: 'carousel', name: 'Educational Swipe', text: '3 Ways to Elevate Your Visual Output →' },
  { id: 5, type: 'educational', name: 'Pro Wisdom', text: 'How to maintain brand consistency across all platforms.' },
  { id: 6, type: 'quote', name: 'Bold Statement', text: 'Design is intelligence made visible.' }
];

const TemplatesPage = () => {
  const [filter, setFilter] = useState('all');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBg, setGeneratedBg] = useState(null);
  const [brandData, setBrandData] = useState(null); // Changed from DEFAULT_BRAND
  const [localBrandData, setLocalBrandData] = useState(DEFAULT_BRAND);
  const [localText, setLocalText] = useState('');
  const [activeTab, setActiveTab] = useState('typography');
  const [templates, setTemplates] = useState([]); // New state for templates
  const [isGeneratingTemplates, setIsGeneratingTemplates] = useState(true); // New state for template loading

  useEffect(() => {
    const savedKit = sessionStorage.getItem('kreavia_brand_data'); // Changed key
    if (savedKit) {
      try {
        const parsed = JSON.parse(savedKit);
        const merged = { 
          ...DEFAULT_BRAND, 
          ...parsed, 
          colors: { ...DEFAULT_BRAND.colors, ...(parsed.colors || {}) }, 
          typography: { ...DEFAULT_BRAND.typography, ...(parsed.typography || {}) } 
        };
        setBrandData(merged);
        setLocalBrandData(merged);
        loadAiTemplates(merged); // Call loadAiTemplates with parsed data
      } catch (err) {
        console.error('Failed to parse brand kit:', err);
        setTemplates(PRESET_TEMPLATES); // Fallback
        setIsGeneratingTemplates(false);
      }
    } else {
      setTemplates(PRESET_TEMPLATES); // Fallback if no brand data
      setIsGeneratingTemplates(false);
    }
  }, []);

  const loadAiTemplates = async (data) => {
    try {
      setIsGeneratingTemplates(true);
      const savedTemplates = sessionStorage.getItem('kreavia_ai_templates');
      if (savedTemplates) {
         setTemplates(JSON.parse(savedTemplates));
         setIsGeneratingTemplates(false);
         return;
      }
      const generated = await generateTemplates(data);
      setTemplates(generated);
      sessionStorage.setItem('kreavia_ai_templates', JSON.stringify(generated));
    } catch (err) {
      console.error('Failed to generate templates', err);
      setTemplates(PRESET_TEMPLATES);
    } finally {
      setIsGeneratingTemplates(false);
    }
  };

  const handleDownloadJPG = async () => {
    const canvas = document.getElementById('template-canvas');
    if (!canvas) return;
    try {
      const dataUrl = await html2canvas(canvas, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#FFFFFF' 
      }).then(c => c.toDataURL('image/jpeg', 0.95));
      
      const activeBrandName = (brandData || DEFAULT_BRAND).brandName || 'Brand';
      const link = document.createElement('a');
      link.download = `${activeBrandName}-Asset-${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleGenerateBackground = async () => {
    if (!localBrandData) return;
    setIsGenerating(true);
    
    try {
      const variations = ['cinematic lighting', 'ethereal atmosphere', 'abstract textures', 'minimal composition', 'dreamy focus'];
      const randomVar = variations[Math.floor(Math.random() * variations.length)];
      
      const prompt = `Premium ${localBrandData.vibe || 'minimalist'} ${localBrandData.niche || 'lifestyle'} lifestyle aesthetic, ${randomVar}, 
      high quality photography, soft depth of field, color palette: ${Object.values(localBrandData.colors).join(', ')}. 
      Seed: ${Date.now()}. No text, professional studio light.`;
      
      const imageUrl = await generateImage(prompt);
      if (imageUrl) {
        setLocalBrandData({ ...localBrandData, customBg: imageUrl });
        setGeneratedBg(imageUrl);
      }
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLocalBrandData({ ...localBrandData, customBg: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // const templates = [ // Removed static templates array
  //   { id: 1, type: 'instagram', title: 'Quote Post', renderType: 'quote', text: 'Elegance is the only beauty that never fades.' },
  //   { id: 2, type: 'reels', title: 'Reel Cover A', renderType: 'reel_cover', text: 'CREATING THE FUTURE' },
  //   { id: 3, type: 'story', title: 'Story Highlight', renderType: 'story', text: 'VIBE CHECK' },
  //   { id: 4, type: 'instagram', title: 'Carousel Slide 1', renderType: 'carousel', text: '3 Tips for Minimalist Living' },
  //   { id: 5, type: 'reels', title: 'Reel Cover B', renderType: 'reel_cover', text: 'A DAY IN THE LIFE' },
  //   { id: 6, type: 'instagram', title: 'Announcement', renderType: 'quote', text: 'BIG THINGS COMING SOON' },
  //   { id: 7, type: 'story', title: 'Q&A Template', renderType: 'story', text: 'ASK ANYTHING' },
  //   { id: 8, type: 'instagram', title: 'Tip of the Day', renderType: 'carousel', text: 'How to Build Consistency' },
  //   { id: 9, type: 'instagram', title: 'Educational', renderType: 'educational', text: 'How to maintain brand consistency.' },
  // ];

  const filtered = filter === 'all' ? templates : templates.filter(t => t.type === filter);

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto pb-20 pt-8 animate-fade-in">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0">
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
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isGeneratingTemplates ? (
               Array.from({ length: 6 }).map((_, i) => (
                 <motion.div 
                   key={i} 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="aspect-[4/5] bg-secondary border border-light/50 rounded-[2rem] overflow-hidden flex flex-col relative"
                 >
                   <div className="flex-1 bg-light/30 animate-pulse flex items-center justify-center p-8">
                      <Wand2 size={32} className="text-muted/20" />
                   </div>
                   <div className="p-6 bg-surface border-t border-light/50 flex flex-col gap-2">
                       <div className="h-3 w-3/4 bg-light animate-pulse rounded-full"></div>
                       <div className="h-2 w-1/3 bg-light animate-pulse rounded-full"></div>
                   </div>
                 </motion.div>
               ))
            ) : filtered.length > 0 ? filtered.map(template => ( 
               <motion.div 
                 key={template.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="group cursor-pointer relative rounded-[2rem] overflow-hidden border border-light/50 shadow-sm hover:shadow-2xl transition-all duration-500 bg-secondary"
               >
                <div className="flex-1 relative overflow-hidden bg-highlight/30 flex items-center justify-center p-8">
                   <div className="w-full h-full shadow-2xl rounded-lg overflow-hidden scale-[0.85] group-hover:scale-100 transition-transform duration-700 origin-center">
                      <TemplateRenderer 
                        type={template.type} // Changed from renderType to type
                        brandData={brandData || DEFAULT_BRAND} 
                        text={template.text} 
                      />
                   </div>
                   
                   {/* Hover Actions */}
                   <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-4 backdrop-blur-md">
                      <button onClick={() => { 
                        setEditingTemplate(template); 
                        setGeneratedBg(null); 
                        const activeBrand = brandData || DEFAULT_BRAND;
                        setLocalBrandData({ ...activeBrand, shapes: activeBrand.shapes || [] });
                        setLocalText(template.text);
                      }} className="btn btn-primary text-[10px] font-black uppercase tracking-widest w-2/3 h-12 shadow-glow flex gap-2 items-center justify-center text-secondary">
                        <Palette size={14} /> Open Editor
                      </button>
                      <button className="btn btn-outline border-white/20 text-white hover:border-accent hover:text-accent text-[10px] font-black uppercase tracking-widest w-2/3 h-12 flex gap-2 items-center justify-center">
                        <Copy size={14} /> Duplicate
                      </button>
                      <button 
                        onClick={() => {
                           setEditingTemplate(template);
                           setTimeout(handleDownloadJPG, 500);
                        }}
                        className="btn btn-ghost text-white/60 hover:text-white text-[10px] font-black uppercase tracking-widest w-2/3 flex gap-2 items-center justify-center"
                      >
                         <Download size={14} /> Quick Export
                      </button>
                   </div>
                </div>
                <div className="p-6 bg-surface border-t border-light/50 flex justify-between items-center group-hover:bg-accent/5 transition-colors">
                   <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase tracking-widest text-primary truncate max-w-[140px]">{template.title}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-accent mt-1 opacity-60">{template.type}</span>
                   </div>
                   <div className="w-10 h-10 rounded-xl bg-white shadow-inner flex items-center justify-center text-accent border border-light/30">
                      {template.type === 'instagram' ? <Layout size={16} /> : <Phone size={16} />}
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
                            { id: 'typography', icon: <Type size={22} />, label: 'Typography' },
                            { id: 'media', icon: <ImageIcon size={22} />, label: 'Media Library' },
                            { id: 'shapes', icon: <Shapes size={22} />, label: 'Geometric elements' },
                            { id: 'palette', icon: <Palette size={22} />, label: 'Brand Palette' },
                          ].map((item) => (
                             <button 
                                key={item.id} 
                                onClick={() => setActiveTab(item.id)}
                                className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-5 p-5 rounded-2xl transition-all border ${
                                   activeTab === item.id 
                                   ? 'bg-accent/10 border-accent text-accent shadow-sm' 
                                   : 'bg-transparent border-transparent hover:bg-black/5 text-primary hover:border-light'
                                } w-full text-center lg:text-left group`}
                             >
                                <div className={`${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>{item.icon}</div>
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

                 {/* Center Canvas Area */}
                 <div className="flex-1 bg-highlight/50 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-[80px] flex items-center justify-between px-10 z-20 pointer-events-none">
                       <div className="pointer-events-auto mt-10">
                          <span className="font-black text-[10px] tracking-widest uppercase text-muted bg-surface/80 px-4 py-2 rounded-full border border-light backdrop-blur-xl shadow-sm">Cloud Synced</span>
                       </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center p-10 lg:p-20 relative overflow-auto pt-24 md:pt-10">
                       <div id="template-canvas" className="relative w-full max-w-[50vh] lg:max-w-[70vh] aspect-[4/5] bg-white shadow-2xl border border-light group overflow-hidden rounded-xl">
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
                            <TemplateRenderer 
                                type={editingTemplate.type} 
                                brandData={localBrandData} 
                                text={localText} 
                            />
                         </div>
                       </div>
                    </div>
                 </div>

                 {/* Right Sidebar */}
                 <div className="hidden md:flex w-[340px] border-l border-light bg-surface flex-col shrink-0 z-20">
                     <div className="h-[80px] border-b border-light flex items-center justify-between px-8 shrink-0 gap-4">
                        <div className="flex-1 flex gap-2">
                           <button onClick={handleDownloadJPG} className="btn btn-primary h-12 flex-1 text-[10px] font-black uppercase tracking-widest shadow-glow flex items-center justify-center gap-2 text-secondary px-2">
                              <Download size={14} /> JPG
                           </button>
                           <button 
                              onClick={(e) => {
                                 const btn = e.currentTarget;
                                 const originalContent = btn.innerHTML;
                                 btn.innerHTML = '<span class="animate-pulse flex items-center gap-2 text-[9px]"><svg class="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> SYNCING...</span>';
                                 setTimeout(() => {
                                    btn.innerHTML = originalContent;
                                    window.open('https://www.canva.com/', '_blank');
                                 }, 1500);
                              }}
                              className="btn h-12 flex-1 text-[10px] font-black uppercase tracking-widest shadow-md flex items-center justify-center gap-2 px-2 hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: '#00C4CC', color: '#FFFFFF', border: 'none' }}
                           >
                              <Sparkles size={14} /> Canva
                           </button>
                        </div>
                        <button onClick={() => setEditingTemplate(null)} className="p-2.5 text-muted hover:text-primary rounded-2xl hover:bg-black/5 transition-colors flex-shrink-0 border border-transparent hover:border-light">
                           <X size={24} />
                        </button>
                     </div>
                    <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-10 custom-scrollbar">
                       {activeTab === 'typography' && (
                          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                             <h4 className="text-[11px] font-black uppercase tracking-widest text-muted">Typography Settings</h4>
                             <div className="flex flex-col gap-3">
                                <label className="text-[10px] uppercase tracking-widest font-black text-muted/60 ml-1">Font Family</label>
                                <select 
                                   value={localBrandData.typography?.headline || 'Playfair Display'}
                                   onChange={(e) => setLocalBrandData({...localBrandData, typography: {...localBrandData.typography, headline: e.target.value}})}
                                   className="input h-12 text-sm bg-secondary border-light text-primary py-0 w-full focus:border-accent font-bold shadow-sm"
                                >
                                   {['Playfair Display', 'Inter', 'Satoshi', 'Outfit', 'Montserrat', 'Space Grotesk'].map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                             </div>
                             <div className="flex flex-col gap-3">
                                <label className="text-[10px] uppercase tracking-widest font-black text-muted/60 ml-1">Font Color</label>
                                <label className="flex items-center gap-4 bg-secondary border border-light rounded-2xl p-4 cursor-pointer hover:border-accent transition-all shadow-sm">
                                   <input 
                                     type="color" 
                                     value={localBrandData.typography?.color || localBrandData.colors?.primary || '#1A1A1A'}
                                     onChange={(e) => setLocalBrandData({...localBrandData, typography: {...localBrandData.typography, color: e.target.value}})}
                                     className="sr-only"
                                   />
                                   <div className="w-10 h-10 rounded-xl shadow-inner border border-black/10 transition-transform hover:scale-105" style={{ backgroundColor: localBrandData.typography?.color || localBrandData.colors?.primary || '#1A1A1A' }}></div>
                                   <div className="flex flex-col">
                                      <span className="text-xs font-black uppercase text-primary mb-1">Text Color Picker</span>
                                      <span className="text-[10px] font-mono text-muted">{localBrandData.typography?.color || localBrandData.colors?.primary || '#1A1A1A'}</span>
                                   </div>
                                </label>
                             </div>
                             <div className="flex flex-col gap-3">
                                <label className="text-[10px] uppercase tracking-widest font-black text-muted/60 ml-1">Content</label>
                                <div className="flex items-start bg-secondary border border-light rounded-xl overflow-hidden focus-within:border-accent shadow-sm">
                                   <textarea 
                                     value={localText}
                                     onChange={(e) => setLocalText(e.target.value)}
                                     rows={4}
                                     className="w-full bg-transparent border-none text-primary text-sm px-4 py-3 outline-none font-bold resize-none custom-scrollbar" 
                                   />
                                </div>
                             </div>
                          </div>
                       )}

                       {activeTab === 'media' && (
                          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
                             <h4 className="text-[11px] font-black uppercase tracking-widest text-muted">Media Library</h4>
                             <div className="flex flex-col gap-3">
                                 <label className="text-[10px] uppercase tracking-widest font-black text-muted/60 ml-1">Upload Picture</label>
                                 <input type="file" onChange={handleImageUpload} className="hidden" id="editor-image-upload" accept="image/*" />
                                 <label htmlFor="editor-image-upload" className="flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border border-dashed border-light hover:border-accent cursor-pointer transition-all bg-secondary/50 hover:bg-white group">
                                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                                       <ImageIcon size={24} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted group-hover:text-primary">Upload Picture</span>
                                </label>
                             </div>
                             
                             <div className="p-5 rounded-2xl bg-accent/5 border border-accent/10 shadow-sm">
                                <div className="flex items-center gap-3 mb-3 text-accent">
                                   <Sparkles size={18} />
                                   <span className="text-[11px] font-black uppercase tracking-widest">AI Backgrounds</span>
                                </div>
                                <p className="text-[10px] text-muted leading-relaxed font-medium">Use the <strong>AI Essence</strong> button in the left sidebar to generate a unique backdrop.</p>
                             </div>
                          </div>
                       )}

                       {activeTab === 'palette' && (
                          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
                             <h4 className="text-[11px] font-black uppercase tracking-widest text-muted">Brand Palette</h4>
                             <div className="flex flex-col gap-4">
                               <label className="text-[10px] uppercase tracking-widest font-black text-muted/60 ml-1">Template Background</label>
                               <div className="grid grid-cols-2 gap-3">
                                 {['primary', 'secondary', 'accent', 'highlight'].map((colorKey) => {
                                   const activeBrand = brandData || DEFAULT_BRAND;
                                   const colorValue = activeBrand.colors?.[colorKey];
                                   if (!colorValue) return null;
                                   const isSelected = localBrandData.colors?.backgroundOverride === colorValue;
                                   
                                   return (
                                     <button 
                                       key={colorKey}
                                       onClick={() => setLocalBrandData({...localBrandData, colors: {...localBrandData.colors, backgroundOverride: colorValue}})}
                                       className={`flex items-center gap-3 p-3 bg-secondary rounded-2xl border transition-all ${isSelected ? 'border-accent shadow-glow scale-[1.02]' : 'border-light hover:border-muted'}`}
                                     >
                                       <div className="w-8 h-8 rounded-full shadow-inner border border-black/10 shrink-0 flex items-center justify-center" style={{ backgroundColor: colorValue }}>
                                         {isSelected && <Sparkles size={12} className="text-white mix-blend-difference" />}
                                       </div>
                                       <div className="flex flex-col text-left overflow-hidden">
                                         <span className="text-[10px] font-black uppercase text-primary truncate">{colorKey}</span>
                                         <span className="text-[8px] font-mono text-muted uppercase">{colorValue}</span>
                                       </div>
                                     </button>
                                   );
                                 })}
                               </div>
                             </div>

                             <div className="flex flex-col gap-4">
                                <label className="text-[10px] uppercase tracking-widest font-black text-muted/60 ml-1">Quick Aesthetics</label>
                                <div className="grid grid-cols-2 gap-3">
                                   <button onClick={() => setLocalBrandData({...localBrandData, colors: {...localBrandData.colors, primary: localBrandData.colors?.highlight || '#F5F5F7', highlight: localBrandData.colors?.primary || '#1A1A1A'}})} className="px-4 py-3 rounded-xl bg-secondary border border-light text-[10px] font-black uppercase tracking-widest hover:border-accent transition-all shadow-sm">Invert Focus</button>
                                   <button onClick={() => setLocalBrandData({...localBrandData, colors: {...localBrandData.colors, primary: '#000000', accent: '#000000', highlight: '#F1F1F1', secondary: '#FFFFFF'}})} className="px-4 py-3 rounded-xl bg-secondary border border-light text-[10px] font-black uppercase tracking-widest hover:border-accent transition-all shadow-sm">Minimalist</button>
                                   <button onClick={() => { setLocalBrandData(brandData); setLocalText(editingTemplate.text); }} className="px-4 py-3 rounded-xl bg-secondary border border-light text-[10px] font-black uppercase tracking-widest hover:border-accent transition-all col-span-2 shadow-sm">Restore Brand Sync</button>
                                </div>
                             </div>
                          </div>
                       )}

                       {activeTab === 'shapes' && (
                          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                             <div className="flex justify-between items-center">
                               <h4 className="text-[11px] font-black uppercase tracking-widest text-muted">Geometric Elements</h4>
                               <button 
                                 onClick={() => {
                                   const isCircle = Math.random() > 0.5;
                                   const newShape = {
                                     type: isCircle ? 'circle' : 'square',
                                     size: Math.floor(Math.random() * 300) + 100,
                                     x: Math.floor(Math.random() * 100),
                                     y: Math.floor(Math.random() * 100),
                                     rotation: Math.floor(Math.random() * 360),
                                     opacity: (Math.floor(Math.random() * 15) + 5) / 100,
                                     blur: Math.floor(Math.random() * 60)
                                   };
                                   setLocalBrandData({...localBrandData, shapes: [...(localBrandData.shapes || []), newShape]});
                                 }}
                                 className="text-[9px] font-black text-white bg-accent px-3 py-1.5 rounded-lg uppercase tracking-widest hover:scale-105 transition-transform shadow-glow flex items-center gap-1.5"
                               >
                                 <Sparkles size={12} /> AI Generate
                               </button>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-4">
                                {[
                                   { type: 'circle', size: 150, opacity: 0.1, blur: 40, x: 20, y: 20 },
                                   { type: 'circle', size: 300, opacity: 0.05, blur: 80, x: 80, y: 80 },
                                   { type: 'square', size: 120, opacity: 0.08, rotation: 45, x: 15, y: 85 },
                                   { type: 'square', size: 250, opacity: 0.04, rotation: 15, x: 85, y: 15 }
                                ].map((shape, idx) => (
                                   <div 
                                      key={idx} 
                                      onClick={() => setLocalBrandData({...localBrandData, shapes: [...(localBrandData.shapes || []), shape]})}
                                      className="aspect-square rounded-2xl border border-light bg-secondary flex flex-col items-center justify-center text-muted hover:border-accent hover:text-accent hover:bg-accent/5 cursor-pointer transition-all shadow-sm group"
                                   >
                                      <div className="w-10 h-10 border-2 border-current opacity-50 group-hover:opacity-100 transition-opacity mb-2" style={{ borderRadius: shape.type === 'circle' ? '50%' : '0%', transform: `rotate(${shape.rotation || 0}deg)` }}></div>
                                      <span className="text-[9px] font-black uppercase tracking-widest">{shape.type} {idx + 1}</span>
                                   </div>
                                ))}
                             </div>

                             {localBrandData.shapes?.length > 0 ? (
                               <div className="flex flex-col gap-3 mt-4">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-[10px] uppercase font-bold text-muted/60">Active Elements</h5>
                                    <button onClick={() => setLocalBrandData({...localBrandData, shapes: []})} className="text-[9px] font-bold text-muted hover:text-red-500 uppercase tracking-widest">Clear All</button>
                                  </div>
                                  <div className="flex flex-col gap-3">
                                    {localBrandData.shapes.map((s, i) => (
                                       <div key={i} className="flex flex-col gap-3 bg-secondary border border-light p-4 rounded-xl shadow-sm">
                                          <div className="flex justify-between items-center mb-1">
                                             <span className="capitalize text-[10px] font-black tracking-widest text-primary">{s.type} {i+1}</span>
                                             <button onClick={() => {
                                               const newShapes = [...localBrandData.shapes];
                                               newShapes.splice(i, 1);
                                               setLocalBrandData({...localBrandData, shapes: newShapes});
                                             }} className="text-muted hover:text-red-500 transition-colors"><X size={14} /></button>
                                          </div>
                                          
                                          <div className="flex items-center gap-3">
                                             <span className="text-[9px] uppercase tracking-widest text-muted w-12">Scale</span>
                                             <input type="range" min="50" max="800" value={s.size || 100} onChange={(e) => {
                                               const newShapes = [...localBrandData.shapes];
                                               newShapes[i] = { ...newShapes[i], size: parseInt(e.target.value) };
                                               setLocalBrandData({...localBrandData, shapes: newShapes});
                                             }} className="flex-1 accent-accent h-1 bg-light rounded-full appearance-none" />
                                          </div>
                                          
                                          <div className="flex items-center gap-3">
                                             <span className="text-[9px] uppercase tracking-widest text-muted w-12">Opacity</span>
                                             <input type="range" min="1" max="100" value={(s.opacity || 0.2) * 100} onChange={(e) => {
                                               const newShapes = [...localBrandData.shapes];
                                               newShapes[i] = { ...newShapes[i], opacity: parseInt(e.target.value) / 100 };
                                               setLocalBrandData({...localBrandData, shapes: newShapes});
                                             }} className="flex-1 accent-accent h-1 bg-light rounded-full appearance-none" />
                                          </div>
                                          
                                          <div className="flex gap-4">
                                             <div className="flex items-center gap-2 flex-1">
                                               <span className="text-[9px] uppercase tracking-widest text-muted w-4">X</span>
                                               <input type="range" min="-50" max="150" value={s.x || 0} onChange={(e) => {
                                                 const newShapes = [...localBrandData.shapes];
                                                 newShapes[i] = { ...newShapes[i], x: parseInt(e.target.value) };
                                                 setLocalBrandData({...localBrandData, shapes: newShapes});
                                               }} className="flex-1 accent-accent h-1 bg-light rounded-full appearance-none" />
                                             </div>
                                             <div className="flex items-center gap-2 flex-1">
                                               <span className="text-[9px] uppercase tracking-widest text-muted w-4">Y</span>
                                               <input type="range" min="-50" max="150" value={s.y || 0} onChange={(e) => {
                                                 const newShapes = [...localBrandData.shapes];
                                                 newShapes[i] = { ...newShapes[i], y: parseInt(e.target.value) };
                                                 setLocalBrandData({...localBrandData, shapes: newShapes});
                                               }} className="flex-1 accent-accent h-1 bg-light rounded-full appearance-none" />
                                             </div>
                                          </div>

                                          <div className="flex items-center gap-3 mt-1 pointer-events-auto">
                                             <span className="text-[9px] uppercase tracking-widest text-muted w-12">Color</span>
                                             <div className="flex items-center gap-2">
                                               {['primary', 'secondary', 'accent', 'highlight'].map(cKey => {
                                                  const cVal = localBrandData.colors?.[cKey];
                                                  if (!cVal) return null;
                                                  return (
                                                    <button
                                                      key={cKey}
                                                      onClick={() => {
                                                         const newShapes = [...localBrandData.shapes];
                                                         newShapes[i] = { ...newShapes[i], color: cVal };
                                                         setLocalBrandData({...localBrandData, shapes: newShapes});
                                                      }}
                                                      className={`w-6 h-6 rounded-full border border-black/10 transition-transform hover:scale-110 ${s.color === cVal ? 'ring-2 ring-accent ring-offset-1 ring-offset-secondary' : ''}`}
                                                      style={{ backgroundColor: cVal }}
                                                    />
                                                  );
                                               })}
                                               <div className="h-4 w-px bg-light mx-1"></div>
                                               <label className="w-6 h-6 rounded-full border border-light cursor-pointer overflow-hidden relative group">
                                                  <div className="absolute inset-0 flex items-center justify-center bg-white group-hover:bg-light transition-colors pointer-events-none">
                                                    <Palette size={10} className="text-muted" />
                                                  </div>
                                                  <input 
                                                    type="color" 
                                                    value={s.color || localBrandData.colors?.accent || '#000000'} 
                                                    onChange={(e) => {
                                                      const newShapes = [...localBrandData.shapes];
                                                      newShapes[i] = { ...newShapes[i], color: e.target.value };
                                                      setLocalBrandData({...localBrandData, shapes: newShapes});
                                                    }} 
                                                    className="opacity-0 absolute -inset-4 cursor-pointer w-[200%] h-[200%]" 
                                                  />
                                               </label>
                                             </div>
                                          </div>
                                       </div>
                                    ))}
                                  </div>
                               </div>
                             ) : (
                               <p className="text-[10px] text-muted text-center font-medium opacity-60 mt-4">Click a shape to add it to your template, or use AI Generate.</p>
                             )}
                          </div>
                       )}
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
