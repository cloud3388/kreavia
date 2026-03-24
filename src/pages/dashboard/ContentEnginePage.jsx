import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Copy, 
  Check, 
  Hash, 
  MessageSquare, 
  Zap,
  Quote,
  Loader2,
  RefreshCw,
  Search,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isFeatureLocked, getPlanStatus } from '../../utils/planPermissions';
import UpgradeModal from '../../components/UpgradeModal';
import { LockedOverlay, BlurredCard } from '../../components/common/LockedFeatures';
import { NudgeInlineCard } from '../../components/common/UpgradeNudges';
import { getActiveBrand } from '../../utils/storage';

// Internal Services
import { 
  generateContentIdeas, 
  generateCaptions, 
  generateHashtags, 
  generateHashtagStrategy,
  refineWithBrandVoice 
} from '../../services/brandAiService';

const ContentEnginePage = () => {
  const [activeTab, setActiveTab] = useState('ideas');
  const [loading, setLoading] = useState(false);
  const [brandData, setBrandData] = useState(null);
  
  // Tab-specific states
  const [ideas, setIdeas] = useState([]);
  const [topic, setTopic] = useState('');
  const [captions, setCaptions] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [hashtagStrategy, setHashtagStrategy] = useState(null);
  const [voiceInput, setVoiceInput] = useState('');
  const [refinedVoiceText, setRefinedVoiceText] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [existingHooksHistory, setExistingHooksHistory] = useState([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Auto-generate hashtag strategy when tab opens
  useEffect(() => {
    if (activeTab === 'hashtags' && !hashtagStrategy && brandData) {
      handleGenerateStrategyHashtags();
    }
  }, [activeTab, hashtagStrategy, brandData]);

    const initBrand = async () => {
      let rawKit = await getActiveBrand();
      
      if (!rawKit) {
        const savedSession = sessionStorage.getItem('currentBrandKit');
        if (savedSession) rawKit = JSON.parse(savedSession);
      }
      
      if (rawKit) {
        sessionStorage.setItem('currentBrandKit', JSON.stringify(rawKit));
        setBrandData(rawKit);
      } else {
        setBrandData({
           brandName: 'Kreavia Demo',
           brandVoice: 'Sophisticated, Minimal, Confident',
           brandArchetype: 'The Visionary',
           niche: 'Lifestyle',
           targetAudience: 'Entrepreneurs',
        });
      }
    };
    initBrand();

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateIdeas = async () => {
    if (!brandData) return;
    setLoading(true);
    const result = await generateContentIdeas(brandData, existingHooksHistory);
    if (result && result.length > 0) {
      setIdeas(result);
      const newTitles = result.map(r => r.title);
      setExistingHooksHistory(prev => [...prev, ...newTitles]);
    }
    setLoading(false);
  };

  const handleGenerateCaptions = async () => {
    if (!topic || !brandData) return;
    setLoading(true);
    const result = await generateCaptions(brandData, topic);
    setCaptions(result);
    setLoading(false);
  };

  const handleGenerateHashtags = async () => {
    if (!topic) return;
    setLoading(true);
    const result = await generateHashtags(brandData?.industry || 'lifestyle', { topic });
    setHashtags(result);
    setLoading(false);
  };

  const handleGenerateStrategyHashtags = async () => {
    if (!brandData) return;
    setLoading(true);
    const result = await generateHashtagStrategy(brandData);
    if (result) setHashtagStrategy(result);
    setLoading(false);
  };

  const handleCopyAllStrategyTags = () => {
    if (!hashtagStrategy) return;
    const allTags = [
      ...(hashtagStrategy.niche || []),
      ...(hashtagStrategy.growth || []),
      ...(hashtagStrategy.brand || [])
    ].map(t => `#${t.tag.replace('#', '')}`).join(' ');
    
    handleCopy(allTags, 'all-strategy-tags');
  };

  const handleRefineVoice = async () => {
    if (!voiceInput || !brandData) return;
    setLoading(true);
    const result = await refineWithBrandVoice(brandData, voiceInput);
    setRefinedVoiceText(result);
    setLoading(false);
  };

  const tabs = [
    { id: 'ideas', label: 'Magic Hooks', icon: <Wand2 size={18} /> },
    { id: 'captions', label: 'AI Captions', icon: <MessageSquare size={18} /> },
    { id: 'hashtags', label: 'Hashtags', icon: <Hash size={18} /> },
    { id: 'voice', label: 'Brand Voice', icon: <BookOpen size={18} /> },
  ];

  const plan = getPlanStatus();

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Content Engine</h1>
        <p style={{ color: '#666' }}>Generate high-performing copy aligned with your brand DNA.</p>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', backgroundColor: '#f0f0f0', padding: '6px', borderRadius: '16px', width: 'fit-content' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              if ((tab.id === 'hashtags' && isFeatureLocked('hashtagStrategy')) || 
                  (tab.id === 'voice' && isFeatureLocked('brandVoice'))) {
                setShowUpgradeModal(true);
                return;
              }
              setActiveTab(tab.id);
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: '700',
              transition: 'all 0.2s',
              backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? '#1a1a1a' : '#666',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
              position: 'relative'
            }}
          >
            {tab.icon}
            {tab.label}
            {((tab.id === 'hashtags' && isFeatureLocked('hashtagStrategy')) || 
              (tab.id === 'voice' && isFeatureLocked('brandVoice'))) && (
              <Crown size={10} style={{ position: 'absolute', top: '4px', right: '4px', color: '#C6A96B' }} />
            )}
          </button>
        ))}
      </div>

      <div style={{ minHeight: '400px' }}>
        {/* IDEAS TAB */}
        {activeTab === 'ideas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {ideas.length === 0 ? (
              <div style={{ padding: '32px', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '24px', backgroundColor: '#fafafa', textAlign: 'center' }}>
                <Zap size={32} style={{ color: '#C6A96B', marginBottom: '16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>Generate Viral Content Hooks</h3>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Get 10 unique hooks based on your brand strategy and niche.</p>
                <button 
                  onClick={handleGenerateIdeas}
                  disabled={loading}
                  style={{ backgroundColor: '#1a1a1a', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 auto' }}
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  Generate Initial Ideas
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px' }}>
                <div>
                   <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Viral Content Hooks</h3>
                   <p style={{ color: '#666', fontSize: '14px' }}>Here are 10 fresh hooks tailored for you.</p>
                </div>
                <button 
                  onClick={handleGenerateIdeas}
                  disabled={loading}
                  style={{ backgroundColor: 'white', color: '#1a1a1a', border: '1px solid rgba(0,0,0,0.1)', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                  Regenerate
                </button>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {ideas.map((idea, i) => (
                <React.Fragment key={i}>
                  <BlurredCard 
                    index={i} 
                    limit={plan.visibleHooks}
                    onUpgrade={() => setShowUpgradeModal(true)}
                  >
                    <div style={{ 
                      padding: '24px', 
                      borderRadius: '20px', 
                      backgroundColor: 'white', 
                      border: '1px solid rgba(0,0,0,0.05)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      minHeight: '160px'
                    }}>
                      <div style={{ marginBottom: '16px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#C6A96B', letterSpacing: '0.1em' }}>{idea.contentType}</span>
                        <p style={{ fontSize: '15px', fontWeight: '700', marginTop: '8px', lineHeight: '1.4' }}>{idea.title}</p>
                      </div>
                      <button onClick={() => handleCopy(idea.title, i)} style={{ backgroundColor: 'transparent', border: 'none', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }}>
                        {copiedId === i ? <Check size={14} color="green" /> : <Copy size={14} />}
                        {copiedId === i ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </BlurredCard>
                  {i === 2 && plan.visibleHooks !== Infinity && (
                    <NudgeInlineCard 
                      message="Get 7 more content hooks plus hashtags and captions with Pro."
                      onUpgrade={() => setShowUpgradeModal(true)}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* CAPTIONS TAB */}
        {activeTab === 'captions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What is this post about?"
                style={{ flex: 1, padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '14px', outline: 'none' }}
              />
              <button 
                onClick={handleGenerateCaptions}
                disabled={loading || !topic}
                style={{ backgroundColor: '#1a1a1a', color: 'white', border: 'none', padding: '0 24px', borderRadius: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Generate'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {captions.map((cap, i) => (
                <BlurredCard 
                  key={i} 
                  index={i} 
                  limit={plan.captionVariations.length}
                  onUpgrade={() => setShowUpgradeModal(true)}
                >
                  <div style={{ 
                    padding: '24px', 
                    borderRadius: '24px', 
                    backgroundColor: 'white', 
                    border: '1px solid rgba(0,0,0,0.05)', 
                    position: 'relative'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: '#f0f0f0', padding: '4px 10px', borderRadius: '6px' }}>{cap.type}</span>
                        <button onClick={() => handleCopy(cap.caption, `cap-${i}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                            {copiedId === `cap-${i}` ? <Check size={16} color="green" /> : <Copy size={16} />}
                        </button>
                      </div>
                      <p style={{ fontSize: '15px', color: '#333', lineHeight: '1.6', whiteSpace: 'pre-wrap', fontFamily: brandData?.typography?.body || 'inherit' }}>{cap.caption}</p>
                    </div>
                  </div>
                </BlurredCard>
              ))}
              
              {captions.length > 0 && (
                <button 
                  onClick={handleGenerateHashtags}
                  style={{ width: 'fit-content', margin: '10px auto', backgroundColor: 'transparent', border: '1px solid #C6A96B', color: '#C6A96B', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                >
                  Generate Hashtags for this post
                </button>
              )}
            </div>

            {hashtags.length > 0 && (
               <div style={{ padding: '24px', borderRadius: '24px', backgroundColor: '#f9f9f9', border: '1px dashed rgba(0,0,0,0.1)' }}>
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                   {hashtags.map((tag, i) => (
                     <span key={i} style={{ fontSize: '13px', color: '#C6A96B', fontWeight: '600' }}>#{tag.replace('#','')}</span>
                   ))}
                 </div>
                 <button 
                  onClick={() => handleCopy(hashtags.join(' '), 'tags')} 
                  style={{ marginTop: '16px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
                 >
                   {copiedId === 'tags' ? <Check size={14} color="green" /> : <Copy size={14} />}
                   Copy all hashtags
                 </button>
               </div>
            )}
          </div>
        )}

        {/* HASHTAGS STRATEGY TAB */}
        {activeTab === 'hashtags' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', minHeight: '400px' }}>
            {isFeatureLocked('hashtagStrategy') && (
              <LockedOverlay 
                benefit="Get 25 niche hashtags tailored to your brand" 
                onUpgrade={() => setShowUpgradeModal(true)} 
              />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px' }}>
              <div>
                 <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Hashtag Strategy</h3>
                 <p style={{ color: '#666', fontSize: '14px' }}>Optimized tags based on your niche, audience, and brand.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={handleCopyAllStrategyTags}
                  disabled={!hashtagStrategy || loading}
                  style={{ backgroundColor: '#1a1a1a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: (!hashtagStrategy || loading) ? 0.5 : 1 }}
                >
                  {copiedId === 'all-strategy-tags' ? <Check size={16} /> : <Copy size={16} />}
                  {copiedId === 'all-strategy-tags' ? 'Copied' : 'Copy All 25 Hashtags'}
                </button>
                <button 
                  onClick={handleGenerateStrategyHashtags}
                  disabled={loading}
                  style={{ backgroundColor: 'white', color: '#1a1a1a', border: '1px solid rgba(0,0,0,0.1)', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                  Regenerate Strategy
                </button>
              </div>
            </div>

            {loading && !hashtagStrategy ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <Loader2 className="animate-spin" size={32} style={{ color: '#C6A96B', margin: '0 auto 16px' }} />
                <p style={{ color: '#666', fontWeight: '600' }}>Generating your custom strategy...</p>
              </div>
            ) : hashtagStrategy ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* NICHE GROUP */}
                <div style={{ padding: '24px', borderRadius: '20px', backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>1</span>
                    GROUP 1 — NICHE HASHTAGS
                    <span style={{ fontSize: '12px', fontWeight: '500', color: '#666', marginLeft: 'auto' }}>High Relevance • Medium Size</span>
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {hashtagStrategy.niche?.map((tag, i) => (
                      <div key={i} style={{ padding: '8px 12px', borderRadius: '10px', backgroundColor: '#f9f9f9', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', color: '#333', fontWeight: '600' }}>#{tag.tag.replace('#','')}</span>
                        <span style={{ fontSize: '11px', color: '#888', fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: '4px' }}>{tag.reach}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* GROWTH GROUP */}
                <div style={{ padding: '24px', borderRadius: '20px', backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>2</span>
                    GROUP 2 — GROWTH HASHTAGS
                    <span style={{ fontSize: '12px', fontWeight: '500', color: '#666', marginLeft: 'auto' }}>Reach Extension • 100K-500K Size</span>
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {hashtagStrategy.growth?.map((tag, i) => (
                      <div key={i} style={{ padding: '8px 12px', borderRadius: '10px', backgroundColor: '#f9f9f9', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', color: '#333', fontWeight: '600' }}>#{tag.tag.replace('#','')}</span>
                        <span style={{ fontSize: '11px', color: '#888', fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: '4px' }}>{tag.reach}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BRAND GROUP */}
                <div style={{ padding: '24px', borderRadius: '20px', backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>3</span>
                    GROUP 3 — BRAND HASHTAGS
                    <span style={{ fontSize: '12px', fontWeight: '500', color: '#666', marginLeft: 'auto' }}>Custom • Small Size</span>
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {hashtagStrategy.brand?.map((tag, i) => (
                      <div key={i} style={{ padding: '8px 12px', borderRadius: '10px', backgroundColor: '#fdfbf7', border: '1px solid rgba(198,169,107,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', color: '#C6A96B', fontWeight: '700' }}>#{tag.tag.replace('#','')}</span>
                        <span style={{ fontSize: '11px', color: '#C6A96B', opacity: 0.8, fontWeight: '700', backgroundColor: 'rgba(198,169,107,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{tag.reach}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PRO TIP */}
                <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'rgba(198, 169, 107, 0.05)', border: '1px solid rgba(198, 169, 107, 0.2)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <Sparkles size={20} style={{ color: '#C6A96B', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ fontSize: '14px', color: '#1a1a1a', display: 'block', marginBottom: '4px' }}>Pro Tip</strong>
                    <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>Use 3-5 niche hashtags + 3-5 growth hashtags + 1-2 brand hashtags per post for best reach.</p>
                  </div>
                </div>

              </div>
            ) : null}
          </div>
        )}

        {/* BRAND VOICE TAB */}
        {activeTab === 'voice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative', minHeight: '400px' }}>
            {isFeatureLocked('brandVoice') && (
              <LockedOverlay 
                benefit="Rewrite any text in your exact brand tone" 
                onUpgrade={() => setShowUpgradeModal(true)} 
              />
            )}
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {(brandData?.brandVoice?.split(',') || ['Refined', 'Minimal', 'Luxury']).map((tone, i) => (
                  <span key={i} style={{ padding: '8px 16px', borderRadius: '99px', backgroundColor: 'rgba(198, 169, 107, 0.1)', color: '#C6A96B', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tone.trim()}</span>
                ))}
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800' }}>Write in my brand voice</h4>
                <textarea 
                  value={voiceInput}
                  onChange={(e) => setVoiceInput(e.target.value)}
                  placeholder="Paste your rough text here..."
                  style={{ height: '150px', padding: '20px', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.1)', resize: 'none', outline: 'none' }}
                />
                <button 
                  onClick={handleRefineVoice}
                  disabled={loading || !voiceInput}
                  style={{ backgroundColor: '#1a1a1a', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyCenter: 'center', gap: '10px' }}
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                  Refine with AI
                </button>
             </div>

             <AnimatePresence>
               {refinedVoiceText && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   style={{ padding: '32px', borderRadius: '24px', backgroundColor: '#fafafa', border: '1px solid #C6A96B', position: 'relative' }}
                 >
                    <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                      <button onClick={() => handleCopy(refinedVoiceText, 'refined')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                        {copiedId === 'refined' ? <Check size={18} color="green" /> : <Copy size={18} />}
                      </button>
                    </div>
                    <h5 style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#C6A96B', marginBottom: '16px' }}>Polished Version</h5>
                    <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#1a1a1a', fontStyle: 'italic' }}>"{refinedVoiceText}"</p>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        )}
      </div>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
};

export default ContentEnginePage;
