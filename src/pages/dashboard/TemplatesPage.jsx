import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  Download, 
  X, 
  Type, 
  Image as ImageIcon, 
  Palette, 
  Copy, 
  Shapes, 
  Sparkles, 
  Loader2, 
  Wand2, 
  Smartphone,
  Check,
  RefreshCw,
  Layout,
  MousePointer2,
  Trash2,
  Plus,
  ChevronRight,
  RotateCcw,
  Star,
  Heart,
  Circle,
  Square,
  Triangle,
  Hexagon,
  Zap,
  Flame,
  Crown,
  Diamond,
  Award,
  Shield,
  Sun,
  Moon,
  Cloud,
  Droplet,
  Share2,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';

// Plan Permissions
import { 
  canExportTemplate, 
  incrementExportCount, 
  isFeatureLocked, 
  getPlanStatus, 
  getExportLimitInfo,
  incrementGenerationCount
} from '../../utils/planPermissions';
import UpgradeModal from '../../components/UpgradeModal';
import { NudgeToast } from '../../components/common/UpgradeNudges';

// Internal Services
import { generateImage } from '../../services/nvidiaService';
import { generateTemplates, generateCaptions } from '../../services/brandAiService';
import { getBrands, getActiveBrand, saveBrand, saveTemplateState, getTemplateState } from '../../utils/storage';

// Internal Components
import TemplateRenderer from '../../components/dashboard/TemplateRenderer';
import ShapePropertyEditor from '../../components/dashboard/ShapePropertyEditor';
import DraggableElement from '../../components/dashboard/DraggableElement';
import { LockedOverlay, BlurredCard, LockedButton } from '../../components/common/LockedFeatures';

const EDITOR_TABS = [
  { id: 'text', icon: <Type size={20} />, label: 'Text Content' },
  { id: 'palette', icon: <Palette size={20} />, label: 'Brand Palette' },
  { id: 'geometry', icon: <Shapes size={20} />, label: 'Geometry' },
  { id: 'media', icon: <ImageIcon size={20} />, label: 'Media Upload' },
  { id: 'elements', icon: <Sparkles size={20} />, label: 'Elements' },
];

const DEFAULT_BRAND_DATA = {
  brandName: 'Brand',
  colors: {
    primary: '#1A1A1A',
    secondary: '#FFFFFF',
    accent: '#C6A96B',
    highlight: '#F5F5F7'
  },
  typography: {
    headline: 'Playfair Display',
    body: 'Inter'
  }
};

const TemplatesPage = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasBrandKit, setHasBrandKit] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [activeTab, setActiveTab] = useState('text');
  const [isSaving, setIsSaving] = useState(false);
  
  // Element Canvas State
  const [canvasElements, setCanvasElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [elementsSubTab, setElementsSubTab] = useState('emoji'); // 'emoji' or 'png'
  const [selectedElementColor, setSelectedElementColor] = useState('#1A1A1A');
  
  // Media Tab State
  const [mediaSubTab, setMediaSubTab] = useState('solid'); // 'solid', 'gradient', 'image', 'ai'
  const [solidColorHex, setSolidColorHex] = useState('#ffffff');
  const [aiBgPrompt, setAiBgPrompt] = useState('');
  const [aiBgStyle, setAiBgStyle] = useState('Minimal');
  const [aiBgHistory, setAiBgHistory] = useState([]);
  
  // Local Editor State
  const [localBrandData, setLocalBrandData] = useState(DEFAULT_BRAND_DATA);
  const [localText, setLocalText] = useState('');
  const [subHeadline, setSubHeadline] = useState('');
  const [badgeText, setBadgeText] = useState('');
  const [extraBody, setExtraBody] = useState('');
  
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);

  // Export & Share State
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved'
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCaption, setShareCaption] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showExportToast, setShowExportToast] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // 1. Try to get active brand from storage
        let rawKit = await getActiveBrand();
        
        // 2. Fallback to sessionStorage if storage found nothing
        if (!rawKit) {
          const savedSession = sessionStorage.getItem('currentBrandKit');
          if (savedSession) {
             rawKit = JSON.parse(savedSession);
          }
        }

        if (!rawKit) {
           setHasBrandKit(false);
           setLoading(false);
           return;
        }
        
        // Keep sessionStorage synced for cross-component stability
        sessionStorage.setItem('currentBrandKit', JSON.stringify(rawKit));
        setHasBrandKit(true);

        // Normalize brand data shape
        const brand = {
          brandName: rawKit.dna?.brand_name || rawKit.brandName || 'Brand',
          niche: rawKit.dna?.niche || rawKit.niche || 'Lifestyle',
          brandVoice: rawKit.brandVoice || rawKit.dna?.tone || 'Premium',
          targetAudience: rawKit.dna?.audience || '',
          colors: rawKit.colors || { primary: '#1A1A1A', accent: '#C6A96B', highlight: '#F5F5F7', secondary: '#FFFFFF' },
          typography: rawKit.typography || { headline: 'Playfair Display', body: 'Inter' },
          logos: rawKit.logos || [],
          ...rawKit
        };
        setLocalBrandData(brand);
        
        // Dynamically load Google Fonts for the templates
        if (brand.typography) {
          const fonts = [brand.typography.headline, brand.typography.body].filter(Boolean);
          if (fonts.length > 0) {
             const fontQuery = fonts.map(f => `family=${f.replace(/ /g, '+')}:wght@400;500;700;900`).join('&');
            const link = document.createElement('link');
            link.href = `https://fonts.googleapis.com/css2?${fontQuery}&display=swap`;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
          }
        }
        
        const data = await generateTemplates(brand);
        setTemplates(data || []);
      } catch (e) {
        console.error('Failed to load templates:', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleOpenEditor = async (template) => {
    setEditingTemplate(template);
    
    const savedState = await getTemplateState(template.id);
    if (savedState) {
      try {
        setLocalBrandData(savedState.localBrandData || localBrandData);
        setLocalText(savedState.localText || template.text || '');
        setSubHeadline(savedState.subHeadline || '');
        setBadgeText(savedState.badgeText || '');
        setExtraBody(savedState.extraBody || '');
        setCanvasElements(savedState.canvasElements || []);
      } catch (e) {
        console.error('Failed to parse saved state:', e);
      }
    } else {
      setLocalText(template.text || '');
      setSubHeadline('');
      setBadgeText('');
      setExtraBody('');
      setCanvasElements([]);
      const savedBrand = sessionStorage.getItem('currentBrandKit');
      if (savedBrand) {
        const rawKit = JSON.parse(savedBrand);
        const brand = {
          brandName: rawKit.dna?.brand_name || rawKit.brandName || 'Brand',
          niche: rawKit.dna?.niche || rawKit.niche || 'Lifestyle',
          brandVoice: rawKit.brandVoice || rawKit.dna?.tone || 'Premium',
          colors: rawKit.colors || { primary: '#1A1A1A', accent: '#C6A96B', highlight: '#F5F5F7', secondary: '#FFFFFF' },
          typography: rawKit.typography || { headline: 'Playfair Display', body: 'Inter' },
          logos: rawKit.logos || [],
          ...rawKit
        };
        setLocalBrandData(brand);
      }
    }
    
    setActiveTab('text');
    setSelectedElementId(null);
  };

  useEffect(() => {
    if (!editingTemplate) return;
    
    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      const stateToSave = {
        localBrandData,
        localText,
        subHeadline,
        badgeText,
        extraBody,
        canvasElements
      };
      await saveTemplateState(editingTemplate.id, stateToSave);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [localBrandData, localText, subHeadline, badgeText, extraBody, canvasElements, editingTemplate]);

  const handleAddCanvasElement = (type, content, iconName = null, customX = 50, customY = 50) => {
    const id = Date.now().toString();
    const newEl = {
      id,
      type,
      content,
      iconName,
      x: customX,
      y: customY,
      width: type === 'text' ? 300 : 120, // default wider width for text blocks
      height: type === 'text' ? 100 : 120,
      rotation: 0,
      zIndex: canvasElements.length + 10,
      color: type === 'png' ? selectedElementColor : undefined,
      fontFamily: type === 'text' ? (localBrandData.typography?.headline || 'Inter') : undefined,
      fontSize: type === 'text' ? 36 : undefined,
      align: type === 'text' ? 'center' : undefined,
      lineHeight: type === 'text' ? 1.2 : undefined,
    };
    setCanvasElements([...canvasElements, newEl]);
    setSelectedElementId(id);
  };

  const updateCanvasElement = (updatedEl) => {
    setCanvasElements(canvasElements.map(e => e.id === updatedEl.id ? updatedEl : e));
  };

  const deleteCanvasElement = (id) => {
    setCanvasElements(canvasElements.filter(e => e.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const bringForward = (id) => {
    const sorted = [...canvasElements].sort((a,b) => a.zIndex - b.zIndex);
    const idx = sorted.findIndex(e => e.id === id);
    if (idx < sorted.length - 1) {
      // Swap zIndex with the next one up
      const temp = sorted[idx].zIndex;
      sorted[idx].zIndex = sorted[idx+1].zIndex;
      sorted[idx+1].zIndex = temp;
      setCanvasElements([...sorted]);
    }
  };

  const sendBackward = (id) => {
    const sorted = [...canvasElements].sort((a,b) => a.zIndex - b.zIndex);
    const idx = sorted.findIndex(e => e.id === id);
    if (idx > 0) {
      // Swap zIndex with the previous one
      const temp = sorted[idx].zIndex;
      sorted[idx].zIndex = sorted[idx-1].zIndex;
      sorted[idx-1].zIndex = temp;
      setCanvasElements([...sorted]);
    }
  };

  // EMOJI DICTIONARY
  const EMOJI_CATEGORIES = {
    Expressions: ['😀','😂','😍','😎','🤔','😡','🥺','🤯','🥳'],
    Nature: ['🌸','🌴','🔥','⭐','✨','⚡','🌊','🍎','🍄'],
    Objects: ['💎','👑','📱','📸','🎨','🚀','💡','🛒','🏆'],
    Symbols: ['✅','💯','❌','⚠️','❤️','💖','🔥','💬','💭'],
    Arrows: ['➡️','⬅️','⬆️','⬇️','↗️','↘️','🔄','↪️','🔽']
  };

  // PNG (Lucide) DICTIONARY
  const PNG_CATEGORIES = {
    Shapes: [
      { id: 'circle', icon: Circle },
      { id: 'square', icon: Square },
      { id: 'triangle', icon: Triangle },
      { id: 'hexagon', icon: Hexagon }
    ],
    Decorative: [
      { id: 'star', icon: Star },
      { id: 'sparkles', icon: Sparkles },
      { id: 'sun', icon: Sun },
      { id: 'moon', icon: Moon },
      { id: 'cloud', icon: Cloud },
      { id: 'droplet', icon: Droplet }
    ],
    Brand: [
      { id: 'crown', icon: Crown },
      { id: 'diamond', icon: Diamond },
      { id: 'zap', icon: Zap },
      { id: 'flame', icon: Flame },
      { id: 'heart', icon: Heart },
      { id: 'shield', icon: Shield },
      { id: 'award', icon: Award }
    ]
  };

  const handleDownloadAdvanced = async (format) => {
    if (!canExportTemplate()) {
      setShowUpgradeModal(true);
      return;
    }

    setShowDownloadMenu(false);
    const el = document.getElementById('editor-preview-canvas');
    if (!el) return;
    
    setIsSaving(true);
    setSelectedElementId(null);
    
    // allow React to strip borders
    await new Promise(r => setTimeout(r, 100));
    
    try {
      let scale = 2;
      let exportFormat = 'image/png';
      let extension = 'png';
      const width = el.offsetWidth;

      if (format === 'square_png') {
        scale = 1080 / width; // High quality 1080 width base
      } else if (format === 'story_png') {
        scale = 1080 / 360; // Usually 360px wide for stories in DOM
      } else if (format === 'compressed_jpg') {
        exportFormat = 'image/jpeg';
        extension = 'jpg';
        scale = 1.5;
      }
      
      const canvas = await html2canvas(el, { scale, useCORS: true, backgroundColor: null });
      const dataUrl = canvas.toDataURL(exportFormat, format === 'compressed_jpg' ? 0.8 : 1.0);
      
      const brandNameStr = (localBrandData.brandName || 'brand').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const tempNameStr = (editingTemplate?.name || 'template').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const dateString = new Date().toISOString().split('T')[0];
      
      const link = document.createElement('a');
      link.download = `${brandNameStr}-${tempNameStr}-${dateString}.${extension}`;
      link.href = dataUrl;
      link.click();

      // Track the export
      incrementExportCount();

      // Nudge 2: Show toast after first export
      const { used } = getExportLimitInfo();
      if (used === 1) {
        setShowExportToast(true);
        setTimeout(() => setShowExportToast(false), 4000);
      }
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareClick = async () => {
    setShowShareModal(true);
    setShareCaption('Generating tailored caption...');
    const topic = editingTemplate?.text || editingTemplate?.name || 'My Brand Journey';
    const caps = await generateCaptions(localBrandData, topic);
    if (caps && caps.length > 0) {
      // Pick the "Medium" or first available caption from the AI array
      const bestCap = caps.find(c => c.type === 'Medium') || caps[0];
      setShareCaption(bestCap.caption || bestCap.text || typeof bestCap === 'string' ? bestCap : JSON.stringify(bestCap));
    } else {
      setShareCaption("Here's a look at my latest brand aesthetic. Drop a comment below if you resonate with this vibe! ✨");
    }
  };

  const copyShareCaption = () => {
    navigator.clipboard.writeText(shareCaption);
    setIsCopying(true);
    setTimeout(() => setIsCopying(false), 2000);
  };

  const handleAiBg = async () => {
    if (isFeatureLocked('editorAIFeature')) {
      setShowUpgradeModal(true);
      return;
    }
    setIsGeneratingBg(true);
    try {
      const finalPrompt = aiBgPrompt.trim() 
        ? `${aiBgStyle} style: ${aiBgPrompt}. Color palette: ${localBrandData.colors.accent}, ${localBrandData.colors.primary}. High resolution, studio quality.`
        : `${aiBgStyle} minimalist ${localBrandData.industry || 'lifestyle'} background, cinematic lighting, aesthetic textures, color palette: ${localBrandData.colors.accent}, ${localBrandData.colors.primary}. High resolution, studio quality.`;
        
      const url = await generateImage(finalPrompt);
      if (url) {
        incrementGenerationCount();
        setLocalBrandData({ ...localBrandData, customBg: url, colors: {...localBrandData.colors, backgroundOverride: null} });
        setAiBgHistory(prev => [url, ...prev].slice(0, 3));
      }
    } catch (e) {
      console.error('AI BG failed:', e);
    } finally {
      setIsGeneratingBg(false);
    }
  };

  if (!hasBrandKit) {
    return (
      <div style={{ padding: '80px 40px', maxWidth: '800px', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(198, 169, 107, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
           <Crown size={32} color="#C6A96B" />
        </div>
        <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#1a1a1a', marginBottom: '16px' }}>Generate your brand kit first</h2>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '32px', maxWidth: '400px', lineHeight: 1.5 }}>
          You need an active brand identity before you can see personalized templates tailored for your niche.
        </p>
        <button 
          onClick={() => navigate('/onboarding')}
          style={{ padding: '16px 32px', backgroundColor: '#1a1a1a', color: 'white', borderRadius: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
        >
          <Sparkles size={16} /> Generate Brand Kit
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#666' }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px', color: '#1a1a1a' }}>Design Studio</h1>
          <p style={{ color: '#666', fontSize: '14px' }}>Your brand essence, translated into high-conversion visuals.</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '32px' }}>
        {templates.map(t => (
          <motion.div 
            key={t.id}
            whileHover={{ y: -8 }}
            style={{ 
              backgroundColor: 'white', 
              borderRadius: '32px', 
              overflow: 'hidden', 
              border: '1px solid rgba(0,0,0,0.05)', 
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)',
              cursor: 'pointer'
            }}
            onClick={() => handleOpenEditor(t)}
          >
            <div style={{ aspectRatio: '4/5', backgroundColor: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10%', position: 'relative' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '12px', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <TemplateRenderer type={t.type} brandData={localBrandData} text={t.text} scale={0.5} />
              </div>
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', opacity: 0, transition: 'opacity 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover-overlay">
                <button style={{ backgroundColor: '#C6A96B', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Edit Template</button>
              </div>
            </div>
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.name}</h3>
                <span style={{ fontSize: '10px', color: '#C6A96B', fontWeight: '700', textTransform: 'uppercase' }}>{t.type}</span>
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                <Layout size={18} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Editor Modal */}
      {createPortal(
        <AnimatePresence>
          {editingTemplate && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(20px)' }}
            >
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'row', backgroundColor: '#0a0a0a', color: 'white', overflow: 'hidden' }}>
                
                {/* 1. Left Tab Rail */}
                <div style={{ width: '80px', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: '20px', backgroundColor: '#0d0d0d' }}>
                   {EDITOR_TABS.map(tab => (
                     <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: activeTab === tab.id ? '#C6A96B' : 'transparent',
                        color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.4)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative'
                      }}
                      title={tab.label}
                     >
                        {tab.icon}
                        {activeTab === tab.id && <motion.div layoutId="tab-indicator" style={{ position: 'absolute', right: '-1px', width: '3px', height: '24px', backgroundColor: '#C6A96B', borderRadius: '3px 0 0 3px' }} />}
                     </button>
                   ))}
                   
                   <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <button 
                        onClick={() => setEditingTemplate(null)}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', backgroundColor: 'transparent' }}
                      >
                        <X size={20} />
                      </button>
                   </div>
                </div>

                {/* 2. Controls Panel */}
                <div style={{ width: '380px', backgroundColor: '#0d0d0d', padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px', borderRight: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto' }}>
                  <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#C6A96B' }}>{EDITOR_TABS.find(t => t.id === activeTab)?.label}</h2>
                  </header>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {activeTab === 'text' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                         <div style={{ padding: '24px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                            <Type size={32} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 16px' }} />
                            <h3 style={{ fontSize: '12px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>Interactive Typography</h3>
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: '20px' }}>
                              You can now click any text directly on the canvas to style it inline, or double-click anywhere to spawn new text.
                            </p>
                            <button 
                              onClick={() => handleAddCanvasElement('text', '<p>Type something...</p>')}
                              style={{ 
                                width: '100%', 
                                padding: '14px', 
                                borderRadius: '12px', 
                                backgroundColor: '#C6A96B', 
                                color: 'white', 
                                border: 'none', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                gap: '8px',
                                fontSize: '12px',
                                fontWeight: '900',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(198, 169, 107, 0.3)'
                              }}
                            >
                               <Plus size={16} /> Add New Text Block
                            </button>
                         </div>
                      </div>
                    )}

                    {activeTab === 'palette' && (
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                             {Object.entries(localBrandData.colors || {}).map(([key, val]) => (
                               key !== 'backgroundOverride' && (
                                <button 
                                  key={key}
                                  onClick={() => setLocalBrandData({...localBrandData, colors: {...localBrandData.colors, backgroundOverride: val}})}
                                  style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                                >
                                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: val, border: '2px solid rgba(255,255,255,0.1)' }}></div>
                                  <span style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>{key}</span>
                                  <span style={{ fontSize: '10px', fontWeight: '700', fontFamily: 'monospace' }}>{val}</span>
                                </button>
                               )
                             ))}
                          </div>
                          
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                             <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase' }}>Quick Aesthetics</label>
                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <button 
                                  onClick={() => setLocalBrandData({...localBrandData, colors: {...localBrandData.colors, primary: localBrandData.colors.highlight, highlight: localBrandData.colors.primary}})}
                                  style={{ border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', padding: '10px', fontSize: '10px', color: 'white', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                  Invert Focus
                                </button>
                                <button 
                                 onClick={() => setLocalBrandData({...localBrandData, colors: {...localBrandData.colors, primary: '#000000', accent: '#000000', highlight: '#F1F1F1', secondary: '#FFFFFF'}})}
                                 style={{ border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', padding: '10px', fontSize: '10px', color: 'white', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                  Minimalist
                                </button>
                             </div>
                             <button 
                              onClick={() => setLocalBrandData(DEFAULT_BRAND_DATA)}
                              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(198, 169, 107, 0.4)', backgroundColor: 'rgba(198, 169, 107, 0.05)', color: '#C6A96B', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '10px', cursor: 'pointer' }}
                             >
                                <RotateCcw size={12} style={{ marginRight: '8px' }} /> Restore Brand Sync
                             </button>
                          </div>
                       </div>
                    )}

                    {activeTab === 'geometry' && (
                       <ShapePropertyEditor 
                        shapes={localBrandData.shapes || []} 
                        onUpdate={(s) => setLocalBrandData({...localBrandData, shapes: s})} 
                       />
                    )}

                    {activeTab === 'media' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                           {/* Media Subtabs */}
                           <div style={{ display: 'flex', gap: '8px', padding: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                              {['solid', 'gradient', 'image', 'ai'].map(tab => (
                                <button 
                                  key={tab}
                                  onClick={() => setMediaSubTab(tab)}
                                  style={{ flex: 1, padding: '10px 4px', borderRadius: '8px', border: 'none', backgroundColor: mediaSubTab === tab ? '#C6A96B' : 'transparent', color: mediaSubTab === tab ? 'white' : 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}
                                >
                                  {tab}
                                </button>
                              ))}
                           </div>

                           {mediaSubTab === 'solid' && (
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                               <h4 style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase' }}>Brand Colors</h4>
                               <div style={{ display: 'flex', gap: '12px' }}>
                                 {Object.entries(localBrandData.colors || {}).map(([key, val]) => (
                                   key !== 'backgroundOverride' && (
                                     <button 
                                       key={key}
                                       onClick={() => setLocalBrandData({...localBrandData, customBg: null, colors: {...localBrandData.colors, backgroundOverride: val}})}
                                       style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: val, border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                                       title={key}
                                     />
                                   )
                                 ))}
                               </div>
                               <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                                 <h4 style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px' }}>Custom Color</h4>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                   <input 
                                     type="color" 
                                     value={solidColorHex} 
                                     onChange={e => {
                                       setSolidColorHex(e.target.value);
                                       setLocalBrandData({...localBrandData, customBg: null, colors: {...localBrandData.colors, backgroundOverride: e.target.value}});
                                     }}
                                     style={{ width: '32px', height: '32px', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: 0 }}
                                   />
                                   <input 
                                     type="text" 
                                     value={solidColorHex}
                                     onChange={e => {
                                       setSolidColorHex(e.target.value);
                                       if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                                          setLocalBrandData({...localBrandData, customBg: null, colors: {...localBrandData.colors, backgroundOverride: e.target.value}});
                                       }
                                     }}
                                     style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px', borderRadius: '6px', fontSize: '12px', width: '80px', fontFamily: 'monospace' }}
                                   />
                                 </div>
                               </div>
                             </div>
                           )}

                           {mediaSubTab === 'gradient' && (
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                               <h4 style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase' }}>Brand Gradients</h4>
                               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                 {[
                                   `linear-gradient(135deg, ${localBrandData.colors.primary}, ${localBrandData.colors.accent})`,
                                   `linear-gradient(45deg, ${localBrandData.colors.secondary}, ${localBrandData.colors.highlight})`,
                                   `linear-gradient(to bottom, ${localBrandData.colors.primary}, #000000)`,
                                   `radial-gradient(circle at center, ${localBrandData.colors.accent}, ${localBrandData.colors.primary})`,
                                   `linear-gradient(to right, ${localBrandData.colors.secondary}, rgba(0,0,0,0.05))`,
                                   `conic-gradient(from 180deg at 50% 50%, ${localBrandData.colors.primary}, ${localBrandData.colors.accent}, ${localBrandData.colors.primary})`
                                 ].map((grad, i) => (
                                   <button 
                                     key={i}
                                     onClick={() => setLocalBrandData({...localBrandData, customBg: null, colors: {...localBrandData.colors, backgroundOverride: grad}})}
                                     style={{ height: '64px', borderRadius: '12px', background: grad, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                                   />
                                 ))}
                               </div>
                             </div>
                           )}

                           {mediaSubTab === 'image' && (
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                               <input 
                                 type="file" 
                                 id="upload-bg" 
                                 hidden 
                                 onChange={(e) => {
                                   const file = e.target.files?.[0];
                                   if (file) {
                                     const reader = new FileReader();
                                     reader.onload = (ev) => {
                                        setLocalBrandData({...localBrandData, customBg: ev.target.result, colors: {...localBrandData.colors, backgroundOverride: null}});
                                     };
                                     reader.readAsDataURL(file);
                                   }
                                 }}
                               />
                               <label 
                                 htmlFor="upload-bg"
                                 style={{ width: '100%', padding: '24px', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', textAlign: 'center' }}
                               >
                                  <ImageIcon size={24} color="#C6A96B" />
                                  <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Upload Image Background</span>
                               </label>

                               {localBrandData.customBg && (
                                 <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                   <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: '800', display: 'flex', justifyContent: 'space-between' }}>
                                      <span>Image Opacity</span>
                                      <span>{Math.round((localBrandData.bgOpacity !== undefined ? localBrandData.bgOpacity : 0.6) * 100)}%</span>
                                   </label>
                                   <input 
                                     type="range" 
                                     min="0" max="1" step="0.05"
                                     value={localBrandData.bgOpacity !== undefined ? localBrandData.bgOpacity : 0.6}
                                     onChange={(e) => setLocalBrandData({...localBrandData, bgOpacity: parseFloat(e.target.value)})}
                                     style={{ width: '100%', accentColor: '#C6A96B' }}
                                   />
                                 </div>
                               )}

                               <h4 style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase' }}>Curated Textures</h4>
                               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                 {[
                                   { name: 'Subtle Paper', url: 'https://www.transparenttextures.com/patterns/rice-paper-2.png' },
                                   { name: 'Linen', url: 'https://www.transparenttextures.com/patterns/woven.png' },
                                   { name: 'Marble', url: 'https://www.transparenttextures.com/patterns/white-diamond-dark.png' },
                                   { name: 'Dark Grain', url: 'https://www.transparenttextures.com/patterns/black-paper.png' },
                                   { name: 'Light Noise', url: 'https://www.transparenttextures.com/patterns/noise-lines.png' },
                                   { name: 'Soft Blur', url: 'https://www.transparenttextures.com/patterns/stardust.png' },
                                   { name: 'Geometric', url: 'https://www.transparenttextures.com/patterns/cubes.png' },
                                   { name: 'Minimal Dots', url: 'https://www.transparenttextures.com/patterns/dots.png' }
                                 ].map((tex, i) => (
                                   <div 
                                     key={i} 
                                     onClick={() => setLocalBrandData({...localBrandData, customBg: tex.url, colors: {...localBrandData.colors, backgroundOverride: null}})}
                                     style={{ position: 'relative', height: '60px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                                   >
                                     <img src={tex.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={tex.name} />
                                     <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '10px', fontWeight: '800', color: 'white' }}>{tex.name}</span>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}

                           {mediaSubTab === 'ai' && (
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
                               {isFeatureLocked('editorAIFeature') && (
                                 <div style={{ position: 'absolute', inset: -10, zIndex: 10, backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
                                   <Sparkles size={32} color="#C6A96B" style={{ marginBottom: '12px' }} />
                                   <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '4px' }}>AI Backgrounds</h4>
                                   <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>Upgrade to Pro to generate custom high-end AI backgrounds.</p>
                                   <button onClick={() => setShowUpgradeModal(true)} style={{ padding: '8px 16px', backgroundColor: '#C6A96B', color: 'white', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}>Unlock Pro</button>
                                 </div>
                               )}
                               <div style={{ display: 'flex', gap: '12px' }}>
                                 <select 
                                  value={aiBgStyle} 
                                  onChange={e => setAiBgStyle(e.target.value)}
                                  style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', padding: '12px', borderRadius: '12px', fontSize: '12px', outline: 'none' }}
                                 >
                                    {['Minimal', 'Luxury', 'Dark', 'Pastel', 'Editorial', 'Abstract'].map(s => <option key={s} value={s}>{s}</option>)}
                                 </select>
                               </div>

                               <textarea 
                                 value={aiBgPrompt}
                                 onChange={e => setAiBgPrompt(e.target.value)}
                                 placeholder="Describe a custom background... (optional)"
                                 style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', padding: '16px', borderRadius: '12px', fontSize: '12px', height: '80px', resize: 'none' }}
                               />

                               <LockedButton
                                 isLocked={isFeatureLocked('editorAIFeature')}
                                 benefit="Generate custom high-end AI backgrounds"
                                 onUpgrade={() => setShowUpgradeModal(true)}
                                 style={{ width: '100%' }}
                               >
                                 <button 
                                   onClick={handleAiBg}
                                   disabled={isGeneratingBg}
                                   style={{ 
                                     width: '100%', 
                                     padding: '16px', 
                                     borderRadius: '12px', 
                                     border: 'none',
                                     backgroundColor: '#C6A96B', 
                                     color: 'white', 
                                     display: 'flex', 
                                     alignItems: 'center', 
                                     justifyContent: 'center',
                                     gap: '8px',
                                     fontWeight: '800',
                                     cursor: 'pointer'
                                   }}
                                 >
                                    {isGeneratingBg ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                                    {isGeneratingBg ? 'Generating...' : 'Generate New Background'}
                                 </button>
                               </LockedButton>

                               {aiBgHistory.length > 0 && (
                                 <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                                   <h4 style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px' }}>Recent AI Generations</h4>
                                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                     {aiBgHistory.map((url, i) => (
                                       <img 
                                         key={i} 
                                         src={url} 
                                         onClick={() => setLocalBrandData({...localBrandData, customBg: url, colors: {...localBrandData.colors, backgroundOverride: null}})}
                                         style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }} 
                                         alt="History bg"
                                       />
                                     ))}
                                   </div>
                                 </div>
                               )}
                             </div>
                           )}
                        </div>
                     )}

                     {activeTab === 'elements' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                           {/* Subtabs */}
                           <div style={{ display: 'flex', gap: '10px', padding: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                               <LockedButton
                                 isLocked={isFeatureLocked('editorEmojiPng')}
                                 benefit="Unlock premium vectors and emoji sets for your designs"
                                 onUpgrade={() => setShowUpgradeModal(true)}
                                 style={{ flex: 1 }}
                               >
                                 <button 
                                   onClick={() => {
                                     if (isFeatureLocked('editorEmojiPng')) {
                                       setShowUpgradeModal(true);
                                     } else {
                                       setElementsSubTab('emoji');
                                     }
                                   }}
                                   style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: elementsSubTab === 'emoji' ? '#C6A96B' : 'transparent', color: elementsSubTab === 'emoji' ? 'white' : 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '800', cursor: 'pointer', position: 'relative' }}
                                 >
                                   EMOJIS
                                   {isFeatureLocked('editorEmojiPng') && <Crown size={10} style={{ position: 'absolute', top: '4px', right: '4px', color: '#C6A96B' }} />}
                                 </button>
                               </LockedButton>
                               <LockedButton
                                 isLocked={isFeatureLocked('editorEmojiPng')}
                                 benefit="Unlock premium vectors and emoji sets for your designs"
                                 onUpgrade={() => setShowUpgradeModal(true)}
                                 style={{ flex: 1 }}
                               >
                                 <button 
                                    onClick={() => {
                                      if (isFeatureLocked('editorEmojiPng')) {
                                        setShowUpgradeModal(true);
                                      } else {
                                        setElementsSubTab('png');
                                      }
                                    }}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: elementsSubTab === 'png' ? '#C6A96B' : 'transparent', color: elementsSubTab === 'png' ? 'white' : 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '800', cursor: 'pointer', position: 'relative' }}
                                  >
                                    PNG ELEMENTS
                                    {isFeatureLocked('editorEmojiPng') && <Crown size={10} style={{ position: 'absolute', top: '4px', right: '4px', color: '#C6A96B' }} />}
                                  </button>
                               </LockedButton>
                           </div>

                           {elementsSubTab === 'emoji' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
                                {isFeatureLocked('editorEmojiPng') && (
                                   <div style={{ position: 'absolute', inset: -10, zIndex: 10, backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
                                      <Lock size={32} color="#C6A96B" style={{ marginBottom: '12px' }} />
                                      <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '4px' }}>Pro Elements</h4>
                                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>Upgrade to Pro to unlock hundreds of premium Emojis and PNG elements.</p>
                                      <button onClick={() => setShowUpgradeModal(true)} style={{ padding: '8px 16px', backgroundColor: '#C6A96B', color: 'white', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}>Unlock Pro</button>
                                   </div>
                                )}
                                {Object.entries(EMOJI_CATEGORIES).map(([cat, emojis]) => (
                                  <div key={cat}>
                                    <h4 style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px' }}>{cat}</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                      {emojis.map(emoji => (
                                        <button 
                                          key={emoji}
                                          onClick={() => handleAddCanvasElement('emoji', emoji)}
                                          style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                           )}

                           {elementsSubTab === 'png' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
                                {isFeatureLocked('editorEmojiPng') && (
                                   <div style={{ position: 'absolute', inset: -10, zIndex: 10, backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
                                      <Lock size={32} color="#C6A96B" style={{ marginBottom: '12px' }} />
                                      <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '4px' }}>Pro Elements</h4>
                                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>Upgrade to Pro to unlock hundreds of premium Emojis and PNG elements.</p>
                                      <button onClick={() => setShowUpgradeModal(true)} style={{ padding: '8px 16px', backgroundColor: '#C6A96B', color: 'white', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}>Unlock Pro</button>
                                   </div>
                                )}
                                {/* Global Color Picker for newly standard elements */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                  <input 
                                    type="color" 
                                    value={selectedElementColor} 
                                    onChange={e => {
                                      const c = e.target.value;
                                      setSelectedElementColor(c);
                                      if (selectedElementId) {
                                        const el = canvasElements.find(el => el.id === selectedElementId);
                                        if (el && el.type === 'png') updateCanvasElement({ ...el, color: c });
                                      }
                                    }}
                                    style={{ width: '28px', height: '28px', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: 0 }}
                                  />
                                  <span style={{ fontSize: '12px', color: 'white', fontWeight: '700' }}>Active Color</span>
                                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                                    {['#FFFFFF', '#000000', localBrandData.colors.accent || '#C6A96B'].map(c => (
                                      <button key={c} onClick={() => {
                                        setSelectedElementColor(c);
                                        if (selectedElementId) {
                                          const el = canvasElements.find(e => e.id === selectedElementId);
                                          if (el && el.type === 'png') updateCanvasElement({ ...el, color: c });
                                        }
                                      }} style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: c, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }} />
                                    ))}
                                  </div>
                                </div>

                                {Object.entries(PNG_CATEGORIES).map(([cat, items]) => (
                                  <div key={cat}>
                                    <h4 style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px' }}>{cat}</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                      {items.map(item => {
                                        const IconComponent = item.icon;
                                        return (
                                          <button 
                                            key={item.id}
                                            onClick={() => handleAddCanvasElement('png', null, item.icon)}
                                            style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                          >
                                            <IconComponent size={24} color={selectedElementColor} fill={cat === 'Shapes' ? selectedElementColor : 'none'} />
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                           )}
                        </div>
                     )}
                  </div>

                  {/* Deprecated Export Space - Purposely Empty */}
                </div>

                {/* 3. Preview Area */}
                <div style={{ flex: 1, backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', position: 'relative' }}>
                   <div style={{ position: 'absolute', top: '40px', left: '40px', display: 'flex', gap: '12px', zIndex: 10 }}>
                      <div style={{ padding: '8px 16px', borderRadius: '99px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                         <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#C6A96B', boxShadow: '0 0 10px #C6A96B' }}></div>
                         <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '2px', color: 'rgba(255,255,255,0.6)' }}>LIVE SYNC ACTIVE</span>
                      </div>
                       
                       {getPlanStatus().maxTemplateExports !== Infinity && (
                         <div style={{ padding: '8px 16px', borderRadius: '99px', backgroundColor: 'rgba(198, 169, 107, 0.1)', border: '1px solid rgba(198, 169, 107, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', fontWeight: '900', color: '#C6A96B', letterSpacing: '0.05em' }}>
                              {getExportLimitInfo().remaining} EXPORTS REMAINING
                            </span>
                         </div>
                       )}
                      
                      <AnimatePresence>
                        {saveStatus === 'saved' && (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: -10 }}
                            style={{ padding: '8px 16px', borderRadius: '99px', backgroundColor: 'rgba(198, 169, 107, 0.1)', border: '1px solid rgba(198, 169, 107, 0.2)', display: 'flex', alignItems: 'center', gap: '8px', color: '#C6A96B' }}
                          >
                            <Check size={12} strokeWidth={3} />
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '1px' }}>Saved</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                   
                   <div style={{ position: 'absolute', top: '40px', right: '40px', display: 'flex', gap: '12px', zIndex: 50 }}>
                      <button 
                        onClick={handleShareClick}
                        style={{ padding: '10px 20px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                      >
                         <Share2 size={16} /> Share
                      </button>
                       <div style={{ position: 'relative' }}>
                         <LockedButton
                           isLocked={!canExportTemplate()}
                           benefit="Upgrade to unlock unlimited high-quality exports"
                           onUpgrade={() => setShowUpgradeModal(true)}
                         >
                           <button 
                             onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                             style={{ padding: '10px 20px', borderRadius: '12px', backgroundColor: '#C6A96B', border: 'none', color: '#1a1a1a', fontSize: '11px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                           >
                              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
                              {isSaving ? 'Exporting...' : 'Download'}
                           </button>
                         </LockedButton>
                        
                        <AnimatePresence>
                          {showDownloadMenu && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }} 
                              animate={{ opacity: 1, y: 0 }} 
                              exit={{ opacity: 0, y: 10 }}
                              style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: '220px', backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                            >
                               <button onClick={() => handleDownloadAdvanced('square_png')} style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', border: 'none', backgroundColor: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: '8px' }} onMouseEnter={e => e.currentTarget.style.backgroundColor='rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}>
                                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'white' }}>PNG (High Quality)</span>
                                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>1080x1080 • Best for posts</span>
                               </button>
                               <button onClick={() => handleDownloadAdvanced('story_png')} style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', border: 'none', backgroundColor: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: '8px' }} onMouseEnter={e => e.currentTarget.style.backgroundColor='rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}>
                                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'white' }}>PNG (Story Size)</span>
                                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>1080x1920 • Best for stories</span>
                               </button>
                               <button onClick={() => handleDownloadAdvanced('compressed_jpg')} style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', border: 'none', backgroundColor: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: '8px' }} onMouseEnter={e => e.currentTarget.style.backgroundColor='rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}>
                                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'white' }}>JPG (Compressed)</span>
                                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Small file size</span>
                               </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                   </div>

                   <div 
                    id="editor-preview-canvas"
                    style={{ 
                      width: editingTemplate.type === 'story' ? '360px' : '450px', 
                      height: editingTemplate.type === 'story' ? '640px' : '562px', 
                      backgroundColor: 'white', 
                      boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                    onPointerDown={() => setSelectedElementId(null)}
                   >
                      <TemplateRenderer 
                        type={editingTemplate.type} 
                        brandData={localBrandData} 
                        text={localText} 
                        subHeadline={subHeadline}
                        badgeText={badgeText}
                        extraBody={extraBody}
                        selectedElementId={selectedElementId}
                        onSelectId={(id) => setSelectedElementId(id)}
                        onUpdateText={(content) => setLocalText(content)}
                        onUpdateSubHeadline={(content) => setSubHeadline(content)}
                        onUpdateBadgeText={(content) => setBadgeText(content)}
                        onUpdateExtraBody={(content) => setExtraBody(content)}
                      />

                      {/* Canvas Interactive Elements */}
                      {canvasElements.map(el => (
                         <DraggableElement
                           key={el.id}
                           element={el}
                           brandData={localBrandData}
                           isSelected={selectedElementId === el.id}
                           onSelect={() => setSelectedElementId(el.id)}
                           onUpdate={updateCanvasElement}
                           onDelete={() => deleteCanvasElement(el.id)}
                           onBringForward={() => bringForward(el.id)}
                           onSendBackward={() => sendBackward(el.id)}
                         />
                      ))}

                       {/* Watermark Overlay */}
                       {getPlanStatus().hasWatermark && (
                          <div style={{ 
                            position: 'absolute', 
                            bottom: '12px', 
                            right: '12px', 
                            padding: '6px 12px', 
                            backgroundColor: 'rgba(255,255,255,0.6)', 
                            backdropFilter: 'blur(10px)',
                            borderRadius: '8px',
                            fontSize: '9px',
                            fontWeight: '800',
                            color: 'rgba(0,0,0,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            zIndex: 1000,
                            pointerEvents: 'none',
                            border: '1px solid rgba(0,0,0,0.03)',
                            fontFamily: 'Inter, sans-serif',
                            textTransform: 'lowercase'
                          }}>
                            <span>Made with</span>
                            <span style={{ fontWeight: '900', color: 'rgba(0,0,0,0.6)' }}>kreavia.ai</span>
                          </div>
                        )}
                    </div>

                   <div style={{ position: 'absolute', bottom: '40px', display: 'flex', gap: '12px', zIndex: 100 }}>
                      <button 
                        onClick={() => {
                          const el = document.getElementById('editor-preview-canvas');
                          if (el) {
                            if (el.style.width === '360px') {
                              el.style.width = '450px';
                              el.style.height = '562px';
                            } else {
                              el.style.width = '360px';
                              el.style.height = '640px';
                            }
                          }
                        }}
                        style={{ padding: '12px 20px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                      >
                         <Smartphone size={14} /> Toggle Mobile View
                      </button>
                      <button 
                        onClick={() => {
                          const newTemplate = { ...editingTemplate, id: 'copy_' + Date.now(), name: editingTemplate.name + ' (Copy)' };
                          const currentTemplates = [...templates];
                          const index = currentTemplates.findIndex(t => t.id === editingTemplate.id);
                          if (index !== -1) {
                            currentTemplates.splice(index + 1, 0, newTemplate);
                            setTemplates(currentTemplates);
                          }
                          setEditingTemplate(newTemplate);
                          setTimeout(async () => {
                            const stateToSave = {
                              localBrandData,
                              localText,
                              subHeadline,
                              badgeText,
                              extraBody,
                              canvasElements
                            };
                            await saveTemplateState(newTemplate.id, stateToSave);
                          }, 500);
                        }}
                        style={{ padding: '12px 20px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                      >
                         <Copy size={14} /> Duplicate View
                      </button>
                   </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowShareModal(false); }}
          >
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              style={{ width: '100%', maxWidth: '800px', backgroundColor: '#1a1a1a', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}
            >
              <div style={{ flex: 1, backgroundColor: '#111', padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                 <div style={{ width: '100%', maxWidth: '280px', aspectRatio: '4/5', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', pointerEvents: 'none', zoom: 0.7 }}>
                    <TemplateRenderer 
                      type={editingTemplate.type} 
                      brandData={localBrandData} 
                      text={localText} 
                      subHeadline={subHeadline}
                      badgeText={badgeText}
                      extraBody={extraBody}
                    />
                 </div>
              </div>
              <div style={{ flex: 1.5, padding: '40px', display: 'flex', flexDirection: 'column' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'white', letterSpacing: '0.05em' }}>Post to Instagram</h3>
                    <button onClick={() => setShowShareModal(false)} style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
                       <X size={16} />
                    </button>
                 </div>
                 
                 <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={14} color="#C6A96B" /> AI Generated Caption
                 </label>
                 
                 <textarea 
                    value={shareCaption}
                    onChange={(e) => setShareCaption(e.target.value)}
                    style={{ width: '100%', height: '180px', resize: 'none', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', color: 'white', fontSize: '14px', lineHeight: 1.5, marginBottom: '16px', fontFamily: 'inherit' }}
                 />
                 
                 <button 
                  onClick={copyShareCaption}
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginBottom: '32px' }}
                 >
                   {isCopying ? <Check size={16} color="#4ADE80" /> : <Copy size={16} />}
                   {isCopying ? 'Copied to Clipboard!' : 'Copy Caption'}
                 </button>
                 
                 <div style={{ marginTop: 'auto' }}>
                    <div style={{ padding: '16px', backgroundColor: 'rgba(198, 169, 107, 0.05)', borderRadius: '12px', border: '1px solid rgba(198, 169, 107, 0.2)', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                       <div style={{ marginTop: '2px' }}><Smartphone size={16} color="#C6A96B" /></div>
                       <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: 0 }}>
                         <strong>Download the image then open Instagram app to post.</strong> Direct posting requires Instagram Business API approval.
                       </p>
                    </div>
                    
                    <button 
                      onClick={() => {
                        handleDownloadAdvanced('square_png');
                        setTimeout(() => setShowShareModal(false), 500);
                      }}
                      style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: '#C6A96B', color: '#1a1a1a', border: 'none', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <Download size={16} /> Download for Instagram
                    </button>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      
      <NudgeToast 
        isVisible={showExportToast}
        message="2 free exports remaining. Upgrade to Pro for unlimited exports without watermark."
        onUpgrade={() => { setShowExportToast(false); setShowUpgradeModal(true); }}
        onDismiss={() => setShowExportToast(false)}
      />
    </div>
  );
};

export default TemplatesPage;
