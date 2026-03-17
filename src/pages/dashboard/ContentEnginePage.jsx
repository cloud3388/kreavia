import React, { useState, useEffect } from 'react';
import { Lightbulb, MessageSquare, Hash, Copy, CheckCircle, RefreshCcw, Sparkles, Quote } from 'lucide-react';
import { generateContentIdeas, generateCaptions, generateHashtags } from '../../services/aiService';

const ContentEnginePage = () => {
  const [activeTab, setActiveTab] = useState('ideas');
  const [loading, setLoading] = useState(false);
  const [brandData, setBrandData] = useState(null);
  const [selectedTone, setSelectedTone] = useState('luxury');
  const [postTopic, setPostTopic] = useState('');
  const [data, setData] = useState({ ideas: [], captions: [], hashtags: [] });
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    const savedKit = sessionStorage.getItem('currentBrandKit');
    const parsed = savedKit ? JSON.parse(savedKit) : { brandVoice: 'Sophisticated', niche: 'Premium', brandArchetype: 'The Visionary' };
    setBrandData(parsed);
    if (parsed.brandVoice?.toLowerCase().includes('bold')) setSelectedTone('bold');
    
    // Initial fetch handled inside this useEffect to ensure brandData is present
    const initialFetch = async () => {
       setLoading(true);
       try {
         const context = { archetype: parsed.brandArchetype, voice: parsed.brandVoice, topic: '' };
         const ideas = await generateContentIdeas(parsed.niche || 'lifestyle', context);
         setData(prev => ({ ...prev, ideas }));
       } finally {
         setLoading(false);
       }
    };
    initialFetch();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const context = {
        archetype: brandData?.brandArchetype,
        voice: brandData?.brandVoice,
        topic: postTopic
      };

      if (activeTab === 'ideas') {
        const ideas = await generateContentIdeas(brandData?.niche || 'lifestyle', context);
        setData(prev => ({ ...prev, ideas }));
      } else if (activeTab === 'captions') {
        const captions = await generateCaptions(selectedTone, context);
        // Clean up formatting: only prepend topic if it's not already there
        const formattedCaptions = captions.map(c => {
           if (!postTopic) return c;
           const cleanPostTopic = postTopic.trim();
           if (c.toLowerCase().startsWith(cleanPostTopic.toLowerCase())) return c;
           return `${cleanPostTopic}: ${c}`;
        });
        setData(prev => ({ ...prev, captions: formattedCaptions }));
      } else if (activeTab === 'hashtags') {
        const hashtags = await generateHashtags(brandData?.niche || 'lifestyle', context);
        setData(prev => ({ ...prev, hashtags }));
      }
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text, index) => {
    // Add Instagram-style formatting (line breaks)
    const formattedText = text.replace(/([.?!])\s+/g, '$1\n\n');
    navigator.clipboard.writeText(formattedText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const tabs = [
    { id: 'ideas', label: 'Viral Post Ideas', icon: <Lightbulb size={18} /> },
    { id: 'captions', label: 'AI Captions', icon: <MessageSquare size={18} /> },
    { id: 'hashtags', label: 'Hashtag Strategy', icon: <Hash size={18} /> },
  ];

  const tones = [
    { id: 'luxury', label: 'Luxury' },
    { id: 'bold', label: 'Bold' },
    { id: 'minimal', label: 'Minimalist' },
    { id: 'witty', label: 'Witty' },
    { id: 'educational', label: 'Educational' },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-8 max-w-4xl pb-20">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex bg-surface p-1.5 rounded-2xl border border-light w-max shadow-sm">
           {tabs.map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex items-center gap-3 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-primary text-secondary shadow-lg scale-105' : 'text-muted hover:text-primary'}`}
             >
               {tab.icon} {tab.label}
             </button>
           ))}
        </div>

        {brandData && (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-accent/10 border border-accent/20 rounded-full shadow-sm">
            <Sparkles size={16} className="text-accent" />
            <span className="text-[10px] uppercase tracking-widest font-black text-accent">{brandData.brandArchetype} Voice</span>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
         <div className="flex-1">
           <h3 className="text-3xl md:text-4xl font-headline text-primary font-bold">
             {activeTab === 'ideas' && 'Content Hooks'}
             {activeTab === 'captions' && 'Smart Captions'}
             {activeTab === 'hashtags' && 'Reach Strategy'}
           </h3>
           <p className="text-muted mt-2 max-w-lg font-medium">
             {activeTab === 'ideas' && `Viral-ready angles tailored for your ${brandData?.brandArchetype || 'brand'}.`}
             {activeTab === 'captions' && 'Social-ready copy that converts, formatted for high engagement platforms.'}
             {activeTab === 'hashtags' && 'Optimized sets based on your unique niche engagement data.'}
           </p>
         </div>
        
        {activeTab === 'captions' && (
           <div className="flex flex-col gap-3 w-full md:w-auto">
              <label className="text-[10px] uppercase tracking-widest font-bold text-muted ml-1">Select Tone</label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                 {tones.map(tone => (
                    <button
                       key={tone.id}
                       onClick={() => setSelectedTone(tone.id)}
                       className={`px-4 py-1.5 rounded-full border text-xs whitespace-nowrap transition-all ${
                          selectedTone === tone.id ? 'bg-accent/10 border-accent/50 text-accent' : 'bg-transparent border-light text-muted hover:border-white/20'
                       }`}
                    >
                       {tone.label}
                    </button>
                 ))}
              </div>
           </div>
        )}
      </div>

       {activeTab === 'captions' && (
          <div className="relative group">
             <input 
                type="text"
                value={postTopic}
                onChange={(e) => setPostTopic(e.target.value)}
                placeholder="What essence shall we capture today?"
                className="w-full bg-surface border-none shadow-sm focus:shadow-md outline-none rounded-2xl px-14 py-5 font-bold text-primary transition-all placeholder:text-muted/40 placeholder:font-medium"
             />
             <MessageSquare className="absolute left-5 top-1/2 -translate-y-1/2 text-accent" size={24} />
             <button 
                onClick={fetchData}
                disabled={loading}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-primary text-secondary rounded-xl hover:scale-105 transition-all disabled:opacity-50 shadow-lg"
             >
                <Send size={20} />
             </button>
          </div>
       )}

      <div className="flex flex-col gap-4 relative min-h-[300px]">
        <AnimatePresence mode="wait">
          {loading ? (
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-4 py-20"
             >
                <div className="relative">
                   <div className="w-12 h-12 border-2 border-accent/20 border-t-accent rounded-full animate-spin"></div>
                   <Sparkles className="absolute inset-0 m-auto text-accent animate-pulse" size={20} />
                </div>
                <span className="text-secondary font-ui text-sm tracking-widest uppercase animate-pulse">AI is writing...</span>
             </motion.div>
          ) : (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="flex flex-col gap-4"
            >
               {activeTab === 'ideas' && data.ideas.map((idea, idx) => (
                 <motion.div 
                   initial={{ x: -20, opacity: 0 }}
                   animate={{ x: 0, opacity: 1 }}
                   transition={{ delay: idx * 0.1 }}
                   key={idx} 
                   className="glass-card p-8 flex justify-between items-center group border-none shadow-sm h-32 bg-surface"
                 >
                   <div className="flex items-center gap-6 flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shrink-0 shadow-inner">
                         <Lightbulb size={28} />
                      </div>
                      <div>
                         <div className="text-[10px] uppercase tracking-widest font-black text-accent mb-1.5">{idea.contentType} hook</div>
                         <div className="font-headline text-xl text-primary font-bold leading-snug">{idea.title}</div>
                      </div>
                   </div>
                   <button onClick={() => copyText(idea.title, idx)} className="text-muted hover:text-accent p-4 rounded-2xl hover:bg-accent/10 transition-all shrink-0 border border-transparent hover:border-accent/20">
                     {copiedIndex === idx ? <CheckCircle size={24} className="text-accent" /> : <Copy size={24} />}
                   </button>
                 </motion.div>
               ))}

               {activeTab === 'captions' && data.captions.map((caption, idx) => (
                 <motion.div 
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   transition={{ delay: idx * 0.1 }}
                   key={idx} 
                   className="glass-card p-10 flex flex-col gap-8 border-none shadow-md bg-surface"
                 >
                    <div className="flex items-start gap-5">
                       <Quote className="text-accent shrink-0 mt-2" size={28} />
                       <div className="font-body text-xl text-primary leading-relaxed whitespace-pre-wrap font-medium">{caption}</div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-light">
                       <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-black text-muted">
                          <MessageSquare size={14} className="text-accent" /> Perception: {selectedTone}
                       </div>
                       <button onClick={() => copyText(caption, idx)} className="btn btn-primary px-8 h-12 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-glow text-secondary">
                         {copiedIndex === idx ? (
                            <>
                               <CheckCircle size={16} /> 
                               <span>Copied to clipboard</span>
                            </>
                         ) : (
                            <>
                               <Copy size={16} /> 
                               <span>Capture for Feed</span>
                            </>
                         )}
                       </button>
                    </div>
                 </motion.div>
               ))}

              {activeTab === 'hashtags' && (
                  <motion.div 
                     initial={{ scale: 0.95, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     className="glass-card p-10 flex flex-col gap-10 border-none shadow-md bg-surface"
                  >
                     <div className="flex items-center gap-4 pb-8 border-b border-light">
                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent shadow-sm">
                           <Hash size={24} />
                        </div>
                        <h4 className="font-headline text-3xl font-bold text-primary">Tag Architecture</h4>
                     </div>
                     <div className="flex flex-wrap gap-3">
                        {data.hashtags.map((tag, idx) => (
                          <span key={idx} className="px-5 py-2.5 bg-secondary border border-light rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:border-accent transition-all cursor-default shadow-sm">
                            {tag.tag || tag}
                          </span>
                        ))}
                     </div>
                     <div className="flex items-start gap-4 p-6 bg-accent/5 rounded-2xl border border-accent/10 group">
                        <Info size={20} className="text-accent shrink-0 mt-0.5" />
                        <p className="text-[11px] text-muted font-medium leading-relaxed">Pro-Tip: Placing optimized tags in the first comment maintains your feed's high-end aesthetic while maximizing reach.</p>
                     </div>
                     <button 
                        onClick={() => copyText(data.hashtags.map(t => t.tag || t).join(' '), 'tags')}
                        className="btn btn-primary self-start flex items-center gap-4 px-10 h-14 shadow-lg text-[10px] font-black uppercase tracking-widest text-secondary"
                     >
                        {copiedIndex === 'tags' ? <CheckCircle size={20} /> : <Copy size={20} />} 
                        Deploy Tag Cloud
                     </button>
                  </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ContentEnginePage;
