import React, { useState, useEffect } from 'react';
import { Palette, Type, Image as ImageIcon, CheckCircle, Sparkles, AlertCircle, Download, FileText, Share2, Check as CheckIcon, MoreVertical, Plus, Edit, Trash, Copy, Copy as CopyIcon, History, RotateCcw, Lock, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoAsset from '../../assets/logo.png';
import { generateBrandIdentity } from '../../services/brandAiService';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import SocialFeedPreview from '../../components/dashboard/SocialFeedPreview';
import UpgradeModal from '../../components/UpgradeModal';
import { LockedOverlay, LockedPopover, LockedButton } from '../../components/common/LockedFeatures';
import { NudgeBanner } from '../../components/common/UpgradeNudges';
import { getBrands, getActiveBrand, saveBrand, deleteBrand } from '../../utils/storage';
import { 
  isFeatureLocked, 
  getRemainingGenerations, 
  incrementGenerationCount, 
  getPlanStatus 
} from '../../utils/planPermissions';

const BrandKitPage = () => {
  const navigate = useNavigate();
  const [brandData, setBrandData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedVar, setCopiedVar] = useState('');
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  
  // Multi-brand state
  const [userBrands, setUserBrands] = useState([]);
  const [activeBrandId, setActiveBrandId] = useState('');
  const [showProModal, setShowProModal] = useState(false);
  const [showBrandLimitModal, setShowBrandLimitModal] = useState(false);
  const [showSharePopover, setShowSharePopover] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);

  // Version History State
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  const handleShare = (e) => {
    if (isFeatureLocked('shareLink')) {
      setShowSharePopover(true);
      return;
    }
    if (!brandData) return;
    const slug = (brandData?.dna?.brand_name || 'my-brand').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const payload = btoa(encodeURIComponent(JSON.stringify(brandData)));
    const url = `${window.location.origin}/brand/${slug}#payload=${payload}`;
    
    navigator.clipboard.writeText(url);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2000);
  };

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        setLoading(true);
        
        // --- ONE-TIME MIGRATION ---
        const legacyBrandsRaw = localStorage.getItem('kreavia_user_brands');
        let brands = await getBrands();
        
        if (legacyBrandsRaw && brands.length === 0) {
          console.log('[Storage] Migrating legacy localStorage brands to IndexedDB...');
          try {
            const legacyBrands = JSON.parse(legacyBrandsRaw);
            for (const b of legacyBrands) {
              await saveBrand(b);
            }
            // Clear legacy to free up space
            localStorage.removeItem('kreavia_user_brands');
            brands = await getBrands();
          } catch (e) {
            console.error('[Storage] Migration failed:', e);
          }
        }
        // ---------------------------

        let activeId = localStorage.getItem('kreavia_active_brand_id');

        // Migration from legacy sessionStorage
        if (brands.length === 0) {
          const savedKit = sessionStorage.getItem('currentBrandKit');
          if (savedKit) {
            try {
              const data = JSON.parse(savedKit);
              const migratedBrand = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...data };
              brands = [migratedBrand];
              activeId = migratedBrand.id;
              await saveBrand(migratedBrand);
            } catch (err) {
              console.error('Failed to parse saved brand kit:', err);
            }
          }
        }

        setUserBrands(brands);
        setActiveBrandId(activeId);

        let data = brands.find(b => b.id === activeId) || brands[0] || null;

        // 2. Fallback to mock generation if no saved kit OR if kit is incomplete
        // 2. Hybrid fallback mechanism (Avoid resetting everything if only one field is missing)
        const defaultSet = {
             brandArchetype: 'The Visionary',
             brandScore: 85,
             brandVoice: 'Sophisticated, Minimal, Confident',
             logos: [{ url: 'https://placehold.co/400x400/1A1A1A/C6A96B?text=V&font=playfair' }],
             colors: { primary: '#1A1A1A', secondary: '#FBFBFD', accent: '#C6A96B', highlight: '#FFFFFF' },
             typography: { headline: 'Playfair Display', body: 'Inter', ui: 'Satoshi' }
        };

        if (!data) {
            console.warn('[BrandKit] No brand data found, using global fallback.');
            data = defaultSet;
        } else {
            // Field-level resilience: Ensure we have the basics without overwriting valid custom data
            data = {
                ...defaultSet,
                ...data,
                colors: { ...defaultSet.colors, ...(data.colors || {}) },
                typography: { ...defaultSet.typography, ...(data.typography || {}) },
                logos: (data.logos && data.logos.length > 0) ? data.logos : defaultSet.logos
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

  // Multi-brand handlers
  const handleSetActive = async (id) => {
    localStorage.setItem('kreavia_active_brand_id', id);
    setActiveBrandId(id);
    const brands = await getBrands();
    const selected = brands.find(b => b.id === id);
    if (selected) {
      setBrandData(selected);
      sessionStorage.setItem('currentBrandKit', JSON.stringify(selected));
    }
    setMenuOpenId(null);
  };

  const handleDeleteBrand = async (id) => {
    if (userBrands.length === 1) {
      alert("You must have at least one brand.");
      return;
    }
    const confirmDelete = window.confirm("Are you sure you want to delete this brand?");
    if (!confirmDelete) return;

    await deleteBrand(id);
    const brands = await getBrands();
    setUserBrands(brands);
    
    if (activeBrandId === id) {
      handleSetActive(brands[0].id);
    }
    setMenuOpenId(null);
  };

  const handleRename = async (id, currentName) => {
    const newName = window.prompt("Enter new brand name:", currentName);
    if (!newName || newName.trim() === '') return;

    const brand = userBrands.find(b => b.id === id);
    if (brand) {
      brand.brandName = newName;
      if (brand.dna) brand.dna.brand_name = newName;
      await saveBrand(brand);
      const brands = await getBrands();
      setUserBrands(brands);
      
      if (activeBrandId === id) {
        setBrandData(brand);
        sessionStorage.setItem('currentBrandKit', JSON.stringify(brand));
      }
    }
    setMenuOpenId(null);
  };

  const handleDuplicate = async (id) => {
    const isPro = localStorage.getItem('kreavia_pro_user') === 'true';
    const limit = isPro ? 5 : 1;
    if (userBrands.length >= limit) {
      setShowProModal(true);
      setMenuOpenId(null);
      return;
    }

    const source = userBrands.find(b => b.id === id);
    if (!source) return;

    const cloned = JSON.parse(JSON.stringify(source));
    cloned.id = crypto.randomUUID();
    cloned.createdAt = new Date().toISOString();
    
    const currentName = cloned.dna?.brand_name || cloned.brandName || 'Brand';
    const newName = currentName + " (Copy)";
    cloned.brandName = newName;
    if (cloned.dna) cloned.dna.brand_name = newName;

    await saveBrand(cloned);
    const brands = await getBrands();
    setUserBrands(brands);
    setMenuOpenId(null);
  };

  const handleCreateNewBrand = () => {
    const isPro = localStorage.getItem('kreavia_pro_user') === 'true';
    const limit = isPro ? 5 : 1;
    if (userBrands.length >= limit) {
      setShowBrandLimitModal(true);
      return;
    }
    navigate('/onboarding');
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedVar(text);
    setTimeout(() => setCopiedVar(''), 2000);
  };

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
        // Request all weights/styles to ensure rendering is accurate
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

  const handleDownloadPDF = async () => {
    const btn = document.getElementById('btn-download-pdf');
    if (!btn) return;
    const originalText = btn.innerHTML;
    try {
      btn.innerHTML = 'GENERATING...';
      btn.disabled = true;

      const element = document.getElementById('brand-kit-printable-area');
      if (!element) throw new Error("Printable area not found");

      // Brief delay to ensure any fonts/images are ready
      await new Promise(r => setTimeout(r, 500));

      const canvas = await html2canvas(element, {
        scale: 2, // higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        windowWidth: 1200,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Calculate A4 proportions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      // Add subsequent pages if content overflows A4 height
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      const brandName = brandData?.dna?.brand_name || brandData?.brandName || 'Brand';
      const safeName = brandName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      pdf.save(`${safeName}_brand_kit.pdf`);

    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  };

  const handleRegenerate = async () => {
    const remaining = getRemainingGenerations();
    if (remaining <= 0) {
      setShowProModal(true);
      return;
    }

    if (!brandData?.dna) {
      alert("No brand DNA found to regenerate from.");
      return;
    }
    setIsRegenerating(true);
    try {
      const regeneratedData = await generateBrandIdentity(brandData.dna);
      incrementGenerationCount();
      
      const vHistory = brandData.versionHistory || [];
      const vNumber = vHistory.length + 1;
      
      const snapshot = JSON.parse(JSON.stringify(brandData));
      delete snapshot.versionHistory;
      
      const newKit = {
        ...brandData,
        ...regeneratedData,
        colors: { ...(brandData.colors || {}), ...(regeneratedData.colors || {}) },
        typography: { ...(brandData.typography || {}), ...(regeneratedData.typography || {}) },
        versionHistory: [
          ...vHistory,
          {
            id: crypto.randomUUID(),
            version: `v${vNumber}`,
            createdAt: new Date().toISOString(),
            data: snapshot
          }
        ]
      };

      const rawBrands = localStorage.getItem('kreavia_user_brands');
      const userBrandsArr = rawBrands ? JSON.parse(rawBrands) : [];
      const newBrands = userBrandsArr.map(b => b.id === brandData.id ? newKit : b);
      
      localStorage.setItem('kreavia_user_brands', JSON.stringify(newBrands));
      sessionStorage.setItem('currentBrandKit', JSON.stringify(newKit));
      setUserBrands(newBrands);
      setBrandData(newKit);
      window.dispatchEvent(new Event('kreavia_brands_updated'));
      
    } catch(err) {
      console.error(err);
      alert("Failed to regenerate brand.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRestoreVersion = async (versionItem) => {
    const vHistory = brandData.versionHistory || [];
    const vNumber = vHistory.length + 1;
    
    // Save current as a snapshot before overwriting
    const snapshot = JSON.parse(JSON.stringify(brandData));
    delete snapshot.versionHistory;
    
    const restoredKit = {
      ...brandData,
      ...versionItem.data,
      versionHistory: [
        ...vHistory,
        {
          id: crypto.randomUUID(),
          version: `v${vNumber}`,
          createdAt: new Date().toISOString(),
          data: snapshot
        }
      ]
    };
    
    const userBrandsArr = await getBrands();
    const newBrands = userBrandsArr.map(b => b.id === brandData.id ? restoredKit : b);
    
    await saveBrand(restoredKit);
    sessionStorage.setItem('currentBrandKit', JSON.stringify(restoredKit));
    setUserBrands(newBrands);
    setBrandData(restoredKit);
    window.dispatchEvent(new Event('kreavia_brands_updated'));
    
    setSelectedVersion(null);
    setIsComparing(false);
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-12 max-w-6xl pb-24 relative"
    >
      {sessionStorage.getItem('brand_kit_just_generated') === 'true' && (
        <NudgeBanner 
          id="brand_kit_ready"
          message="Your brand kit is ready!"
          benefit="Share it with clients or your team with a Pro link — upgrade to unlock"
          onUpgrade={() => setShowProModal(true)}
          onDismiss={() => sessionStorage.removeItem('brand_kit_just_generated')}
        />
      )}
      
      {/* My Brands Section */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-headline font-bold text-primary flex items-center gap-2">
          My Brands <span className="text-xs font-normal text-muted bg-surface py-1 px-2 rounded-full border border-light">{userBrands.length}</span>
        </h2>
        
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
          {userBrands.map((brand) => {
             const isActive = activeBrandId === brand.id;
             const isMenuOpen = menuOpenId === brand.id;
             const generatedDate = new Date(brand.createdAt || brand.generatedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
             const primaryColor = brand.colors?.primary || '#1A1A1A';
             const bName = brand.dna?.brand_name || brand.brandName || 'Brand Name';
             const bNiche = brand.dna?.niche || brand.niche || 'Lifestyle';
             const bStyle = brand.dna?.style || 'Premium';
             const bLogo = brand.logos?.[0]?.url || brand.logo || logoAsset;
             
             return (
               <motion.div variants={itemVariants} key={brand.id} className={`snap-start min-w-[300px] w-[300px] bg-surface border ${isActive ? 'border-accent/50 shadow-md ring-1 ring-accent/20' : 'border-light'} rounded-xl p-5 flex flex-col gap-4 relative transition-all group shrink-0`}>
                 
                 {/* Active Badge */}
                 {isActive && (
                   <div className="absolute -top-3 left-4 bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full flex items-center gap-1 shadow-sm">
                     <CheckIcon size={12} strokeWidth={3} /> Active
                   </div>
                 )}

                 {/* Menu Toggle */}
                 <button 
                   onClick={() => setMenuOpenId(isMenuOpen ? null : brand.id)}
                   className="absolute top-4 right-2 p-2 text-muted hover:text-primary transition-colors bg-white rounded-full z-10"
                 >
                   <MoreVertical size={16} />
                 </button>
                 
                 {/* Dropdown Menu */}
                 <AnimatePresence>
                   {isMenuOpen && (
                     <>
                       {/* Invisible overlay to close menu */}
                       <div className="fixed inset-0 z-20" onClick={() => setMenuOpenId(null)}></div>
                       <motion.div 
                         initial={{ opacity: 0, scale: 0.95, y: -10 }}
                         animate={{ opacity: 1, scale: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.95, y: -10 }}
                         className="absolute top-12 right-2 w-48 bg-white border border-light rounded-lg shadow-xl z-30 py-2 overflow-hidden"
                       >
                         {!isActive && (
                           <button onClick={() => handleSetActive(brand.id)} className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-surface flex items-center gap-2">
                             <CheckIcon size={14} className="text-green-500" /> Set as Active Brand
                           </button>
                         )}
                         <button onClick={() => { setMenuOpenId(null); handleSetActive(brand.id); navigate('/dashboard/settings'); }} className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-surface flex items-center gap-2">
                           <Edit size={14} /> Edit Brand Kit
                         </button>
                         <button onClick={() => handleRename(brand.id, bName)} className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-surface flex items-center gap-2">
                           <Type size={14} /> Rename
                         </button>
                         <button onClick={() => handleDuplicate(brand.id)} className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-surface flex items-center gap-2">
                           <CopyIcon size={14} /> Duplicate
                         </button>
                         <button onClick={() => handleDeleteBrand(brand.id)} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 border-t border-light mt-1 pt-3">
                           <Trash size={14} /> Delete
                         </button>
                       </motion.div>
                     </>
                   )}
                 </AnimatePresence>

                 {/* Top Row: Logo & Name */}
                 <div className="flex items-center gap-4 mt-2">
                   <div className="w-14 h-14 rounded-full border border-light/50 bg-white shadow-sm flex items-center justify-center p-2 shrink-0 overflow-hidden relative">
                     <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent pointer-events-none"></div>
                     <img src={bLogo} alt={bName} className="w-full h-full object-contain mix-blend-multiply" />
                   </div>
                   <div className="flex flex-col">
                     <h4 className="font-headline font-semibold text-primary text-lg truncate w-40">{bName}</h4>
                     <p className="text-xs text-muted flex items-center gap-1.5 truncate">
                       <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }}></span>
                       {generatedDate}
                     </p>
                   </div>
                 </div>

                 {/* Tags Row */}
                 <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-light/50">
                   <span className="text-[10px] font-medium bg-surface text-muted px-2.5 py-1 rounded-md uppercase tracking-wide border border-light">{bNiche}</span>
                   <span className="text-[10px] font-medium bg-surface text-muted px-2.5 py-1 rounded-md uppercase tracking-wide border border-light">{bStyle}</span>
                   <span className="text-[10px] font-medium bg-accent/10 text-accent px-2.5 py-1 rounded-md uppercase tracking-wide border border-accent/20 truncate max-w-[120px]" title={brand.brandArchetype}>{brand.brandArchetype}</span>
                 </div>
               </motion.div>
             );
          })}
          
          {/* Create New Brand Card */}
          <motion.div variants={itemVariants} className="snap-start min-w-[280px] w-[280px] shrink-0">
             <button 
               onClick={handleCreateNewBrand}
               className="w-full h-full min-h-[170px] border-2 border-dashed border-light/80 hover:border-accent/50 rounded-xl flex flex-col items-center justify-center gap-3 text-muted hover:text-primary transition-colors hover:bg-surface/50 group"
             >
               <div className="w-12 h-12 rounded-full bg-surface border border-light group-hover:border-accent/30 group-hover:scale-110 group-hover:bg-accent/5 transition-all flex items-center justify-center">
                 <Plus size={24} className="group-hover:text-accent transition-colors" />
               </div>
               <span className="font-medium">Create New Brand</span>
             </button>
          </motion.div>
        </div>
      </div>

      {/* Upgrade Modal Hook */}
      <UpgradeModal isOpen={showProModal} onClose={() => setShowProModal(false)} />

      {/* Brand Limit Modal */}
      <AnimatePresence>
        {showBrandLimitModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowBrandLimitModal(false)}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1000 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ 
                position: 'fixed', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                width: '100%',
                maxWidth: '420px',
                backgroundColor: 'white',
                borderRadius: '28px',
                padding: '44px',
                zIndex: 1001,
                textAlign: 'center',
                boxShadow: '0 30px 60px rgba(0,0,0,0.25)'
              }}
            >
              <div style={{ backgroundColor: '#C6A96B', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', color: 'white', boxShadow: '0 8px 24px rgba(198, 169, 107, 0.4)' }}>
                <Lock size={32} />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#1a1a1a', marginBottom: '12px', lineHeight: 1.2 }}>
                You have used your 1 free brand kit
              </h3>
              <p style={{ color: '#666', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
                Upgrade to Pro to create up to 5 brand kits and build your full brand portfolio.
              </p>
              
              <button 
                onClick={() => { setShowBrandLimitModal(false); setShowProModal(true); }}
                style={{ 
                  width: '100%', 
                  backgroundColor: '#1a1a1a', 
                  color: 'white', 
                  border: 'none', 
                  padding: '18px', 
                  borderRadius: '16px', 
                  fontWeight: '800', 
                  fontSize: '15px', 
                  cursor: 'pointer', 
                  marginBottom: '20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
              >
                Upgrade to Pro
              </button>
              
              <div style={{ fontSize: '12px', color: '#999', fontWeight: '600' }}>
                Or <button 
                  onClick={() => { setShowBrandLimitModal(false); handleDeleteBrand(userBrands[0].id); }} 
                  style={{ background: 'none', border: 'none', color: '#C6A96B', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  delete your current brand
                </button> to start fresh
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div id="brand-kit-printable-area" className="flex flex-col gap-12 bg-main rounded-[2.5rem] p-4 md:p-8">
        {/* Overview Card */}
        <motion.div variants={itemVariants} className="glass-card p-10 flex justify-between items-center border-accent/20 bg-surface relative overflow-hidden group shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <h3 className="text-accent text-[10px] font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <Sparkles size={12} /> Brand Identity DNA
          </h3>
          <div className="text-5xl font-headline text-primary font-bold tracking-tight text-primary">{brandData?.brandArchetype || 'The Visionary'}</div>
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
               <button onClick={handleRegenerate} disabled={isRegenerating} className="text-[10px] font-bold text-accent uppercase tracking-widest hover:text-primary transition-colors border-b border-accent/20 pb-1 flex items-center gap-1">
                 {isRegenerating ? <div className="w-3 h-3 border border-accent/20 border-t-accent rounded-full animate-spin"></div> : <Sparkles size={12} />}
                 Regenerate AI Identity
               </button>
             </div>
             
             <div className="glass-card flex flex-col items-center justify-center relative group overflow-hidden border-light h-[280px] bg-white shadow-lg">
                 <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                 <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-2 rounded-full bg-surface shadow-md cursor-help" title="High Resolution PNG">
                       < ImageIcon size={14} className="text-accent" />
                    </div>
                 </div>
                 <img 
                   src={brandData?.logos?.[0]?.url || brandData?.logo || logoAsset} 
                   alt="Primary Logo" 
                   className="w-48 h-48 object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-700 rounded-xl mix-blend-multiply" 
                 />
                 
                 <div className="absolute inset-x-0 bottom-0 p-6 flex gap-3 h-20 bg-gradient-to-t from-primary to-transparent backdrop-blur-md border-t border-white/5">
                    <a 
                      href={brandData?.logos?.[0]?.url || brandData?.logo || logoAsset} 
                      download="Brand-Logo.png"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary text-[10px] uppercase font-bold tracking-widest flex-1 h-10 shadow-glow flex items-center justify-center gap-2 border border-accent/20"
                    >
                      <Download size={14} /> PNG/SVG
                    </a>
                    <a 
                      href={brandData?.logos?.[0]?.url || brandData?.logo || logoAsset} 
                      download="Brand-Logo-HQ.png"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline text-[10px] uppercase font-bold tracking-widest flex-1 h-10 border-accent/20 text-accent hover:border-accent flex items-center justify-center gap-2 bg-surface/10"
                    >
                      <FileText size={14} /> HQ Print
                    </a>
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
               <button 
                 onClick={() => navigate('/dashboard/settings')}
                 className="btn btn-outline border-accent/30 text-accent hover:bg-accent hover:text-white transition-all duration-300 font-bold uppercase tracking-widest text-[10px] px-6 h-9 rounded-full shadow-sm"
               >
                 Edit Palette
               </button>
             </div>
             
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 h-[280px]">
               {brandData?.colors ? Object.entries(brandData.colors).map(([name, hex]) => (
                 <div key={name} className="glass-card overflow-hidden group flex flex-col border-none shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                   <div 
                     className="flex-1 w-full transition-transform duration-700 group-hover:scale-110 relative" 
                     style={{ backgroundColor: hex || '#3E2723' }}
                   >
                     <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Copy size={24} className="text-secondary drop-shadow-md opacity-50" />
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
               )) : null}
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
                    <div className="absolute inset-0 bg-accent/5 opacity-5 pointer-events-none" style={{ backgroundColor: 'rgba(141, 110, 99, 0.02)' }}></div>
                    <div className="text-[9px] font-black uppercase tracking-[0.25em] text-accent/60 mb-8 flex items-center gap-2">
                      <div className="w-4 h-px bg-accent/30"></div> Typesetting Specimen
                    </div>
                    
                    <h4 
                      className="text-6xl mb-6 leading-[1.05] text-primary font-bold tracking-tight text-primary transition-all duration-700"
                      style={{ fontFamily: brandData?.typography?.headline || 'Playfair Display' }}
                    >
                      The Art of Essence
                    </h4>
                    
                    <p 
                      className="text-primary/70 leading-[1.8] text-lg max-w-lg font-medium transition-all duration-700 mb-8"
                      style={{ fontFamily: brandData?.typography?.body || 'Inter' }}
                    >
                      Your brand story begins here. Every detail crafted with intention.
                    </p>

                    <div 
                      className="inline-block px-8 py-4 bg-primary text-secondary rounded-full tracking-[0.2em] font-bold text-[11px] shadow-lg shadow-black/10 transition-all duration-700"
                      style={{ fontFamily: brandData?.typography?.ui || 'Satoshi', alignSelf: 'flex-start' }}
                    >
                      BUTTON TEXT / NAV LINK
                    </div>

                    <div className="mt-12 flex gap-4">
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
             
             <div 
               className="p-10 flex flex-col gap-8 min-h-[340px] relative overflow-hidden group shadow-2xl rounded-[2.5rem] border border-white/20"
               style={{ background: '#0F0F0F', color: '#FFFFFF' }}
             >
                <div className="absolute top-0 right-0 w-48 h-48 bg-accent/20 blur-[100px] rounded-full -mr-24 -mt-24 group-hover:bg-accent/40 transition-all duration-1000"></div>
                <div className="relative z-10">
                   <div className="text-accent text-[9px] font-black uppercase tracking-[0.2em] mb-4">Master Archetype</div>
                   <div className="text-4xl font-headline font-bold tracking-tight mb-2 text-white">{brandData?.brandArchetype || 'The Visionary'}</div>
                </div>
                <div className="w-16 h-0.5 bg-accent/40 relative z-10 mt-2"></div>
                <div className="relative z-10 overflow-hidden">
                   <div className="text-accent/60 text-[9px] font-black uppercase tracking-[0.2em] mb-6">Tone of Voice</div>
                   <div className="flex flex-col gap-3">
                      {(brandData?.brandVoice || 'Sophisticated, Minimal, Confident').split(',').map((tone, idx) => (
                        <div key={idx} className="flex items-center gap-3 group/item">
                           <div className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-accent animate-pulse' : 'bg-accent/40'}`}></div>
                           <span className="text-sm font-bold tracking-wide text-white/90 group-hover/item:text-accent transition-colors">{tone.trim()}</span>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="mt-auto relative z-10 flex gap-3 no-print">                   <button 
                    id="btn-download-pdf"
                    onClick={handleDownloadPDF}
                    className="btn bg-white/10 hover:bg-white/20 border border-white/30 text-white flex-1 py-4 transition-all duration-500 font-black uppercase tracking-[0.2em] text-[10px] flex justify-center items-center gap-2 group/pdf"
                  >
                    <Download size={14} className="group-hover/pdf:translate-y-0.5 transition-transform" />
                    Download PDF
                  </button>

                  <div style={{ flex: 1, position: 'relative' }}>
                    <LockedButton
                      isLocked={isFeatureLocked('shareLink')}
                      benefit="Send clients a beautiful brand presentation"
                      onUpgrade={() => setShowProModal(true)}
                    >
                      <button 
                        className={`btn py-4 shadow-glow transition-all duration-500 font-bold uppercase tracking-[0.2em] text-[8px] w-full flex items-center justify-center gap-2 ${isLinkCopied ? 'bg-green-600 hover:bg-green-500 text-white border-none' : 'btn-primary'}`}
                      >
                        {isLinkCopied ? <><CheckIcon size={14} /> Copied!</> : <><Share2 size={14} /> Share Kit</>}
                      </button>
                    </LockedButton>
                  </div>
                </div>
             </div>
          </motion.div>
         
      </div>

      </div>

      {brandData?.versionHistory && brandData.versionHistory.length > 0 && (
        <motion.div variants={itemVariants} className="mt-8 border-t border-light/50 pt-8 no-print relative min-h-[200px]">
          {isFeatureLocked('versionHistory') && (
            <LockedOverlay 
              benefit="Never lose a brand direction you loved" 
              onUpgrade={() => setShowProModal(true)} 
            />
          )}
          <div className="flex items-center gap-3 mb-6 px-2">
            <h3 className="text-xl font-headline text-primary font-bold">Previous Versions</h3>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-surface text-muted px-2 py-1 rounded-sm border border-light">
              {brandData.versionHistory.length} History
            </span>
          </div>
          <div className={`flex gap-4 overflow-x-auto pb-4 hide-scrollbar ${isFeatureLocked('versionHistory') ? 'opacity-30 pointer-events-none' : ''}`}>
             {brandData.versionHistory.slice().reverse().map(v => {
               const vColors = Object.values(v.data.colors || {});
               const vDate = new Date(v.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
               return (
                 <button 
                  key={v.id} 
                  onClick={() => setSelectedVersion(v)}
                  className="min-w-[200px] bg-surface border border-light p-4 rounded-2xl flex flex-col gap-3 hover:-translate-y-1 hover:shadow-lg transition-all group shrink-0 text-left"
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-sm bg-accent/10 text-accent px-2 py-0.5 rounded-md uppercase tracking-wider">{v.version}</span>
                    <span className="text-[10px] text-muted">{vDate}</span>
                  </div>
                  <div className="flex h-6 w-full rounded-md overflow-hidden bg-light">
                    {vColors.slice(0, 4).map((hex, i) => (
                      <div key={i} className="flex-1 h-full" style={{ backgroundColor: hex }}></div>
                    ))}
                  </div>
                  <div className="text-xs text-muted truncate">{v.data.brandArchetype || 'Brand'}</div>
                </button>
               )
             })}
          </div>
        </motion.div>
      )}

      {/* Version Compare Modal */}
      <AnimatePresence>
        {selectedVersion && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-main/90 backdrop-blur-md"
              onClick={() => { setSelectedVersion(null); setIsComparing(false); }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-[5%] -translate-x-1/2 w-[90%] max-w-5xl bg-surface border border-light rounded-3xl p-6 z-50 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center border-b border-light pb-4 mb-6">
                <div>
                  <h3 className="text-2xl font-headline font-bold">Version History: <span className="text-accent ml-2">{selectedVersion.version}</span></h3>
                  <p className="text-xs text-muted mt-1 uppercase tracking-widest">{new Date(selectedVersion.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-3">
                   <button onClick={() => setIsComparing(!isComparing)} className="btn btn-outline py-2.5 text-xs">
                     {isComparing ? 'Hide Current' : 'Compare with Current'}
                   </button>
                   <button onClick={() => handleRestoreVersion(selectedVersion)} className="btn btn-primary py-2.5 text-xs flex items-center gap-2">
                     <RotateCcw size={14} /> Restore This Version
                   </button>
                </div>
              </div>
              
              <div className={`grid grid-cols-1 ${isComparing ? 'md:grid-cols-2 gap-8' : 'max-w-2xl mx-auto w-full gap-8'}`}>
                {/* Historical Version */}
                <div className="glass-card bg-main border-none p-8 flex flex-col gap-6">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-accent/80 text-center mb-2 flex items-center justify-center gap-2">
                    <History size={14} /> {selectedVersion.version} Snapshot
                  </div>
                  
                  <div className="flex flex-col items-center">
                     <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center p-2 shadow-sm border border-light mix-blend-multiply overflow-hidden mb-4">
                       <img src={selectedVersion.data.logos?.[0]?.url || selectedVersion.data.logo || logoAsset} className="w-full h-full object-contain" />
                     </div>
                     <span className="font-bold text-xl">{selectedVersion.data.brandArchetype || 'Visionary'}</span>
                  </div>

                  <div>
                     <div className="text-[10px] text-muted font-bold uppercase tracking-widest mb-3">Color Palette</div>
                     <div className="flex rounded-xl overflow-hidden h-12 shadow-inner border border-light">
                       {(Object.values(selectedVersion.data.colors || {})).slice(0, 4).map((c, i) => (
                         <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }}></div>
                       ))}
                     </div>
                  </div>

                  <div>
                     <div className="text-[10px] text-muted font-bold uppercase tracking-widest mb-3">Typography</div>
                     <div className="p-4 bg-surface rounded-xl border border-light flex flex-col gap-3">
                       <div><span className="text-[10px] uppercase text-muted mr-2">Headline:</span> <span className="font-bold text-sm" style={{ fontFamily: selectedVersion.data.typography?.headline }}>{selectedVersion.data.typography?.headline}</span></div>
                       <div><span className="text-[10px] uppercase text-muted mr-2">Body:</span> <span className="font-bold text-sm" style={{ fontFamily: selectedVersion.data.typography?.body }}>{selectedVersion.data.typography?.body}</span></div>
                     </div>
                  </div>
                </div>

                {/* Current Version */}
                {isComparing && (
                  <div className="glass-card bg-main border-none p-8 flex flex-col gap-6 relative">
                    <div className="absolute inset-0 bg-green-500/5 mix-blend-overlay pointer-events-none"></div>
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-green-500 text-center flex items-center justify-center gap-2 mb-2">
                      <CheckCircle size={14} /> Current Brand
                    </div>
                    
                    <div className="flex flex-col items-center">
                       <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center p-2 shadow-sm border border-light mix-blend-multiply overflow-hidden mb-4">
                         <img src={brandData.logos?.[0]?.url || brandData.logo || logoAsset} className="w-full h-full object-contain" />
                       </div>
                       <span className="font-bold text-xl">{brandData.brandArchetype || 'Visionary'}</span>
                    </div>

                    <div>
                       <div className="text-[10px] text-muted font-bold uppercase tracking-widest mb-3">Color Palette</div>
                       <div className="flex rounded-xl overflow-hidden h-12 shadow-inner border border-light/50">
                         {(Object.values(brandData.colors || {})).slice(0, 4).map((c, i) => (
                           <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }}></div>
                         ))}
                       </div>
                    </div>

                    <div>
                       <div className="text-[10px] text-muted font-bold uppercase tracking-widest mb-3">Typography</div>
                       <div className="p-4 bg-surface/50 rounded-xl border border-light/50 flex flex-col gap-3">
                         <div><span className="text-[10px] uppercase text-muted mr-2">Headline:</span> <span className="font-bold text-sm" style={{ fontFamily: brandData.typography?.headline }}>{brandData.typography?.headline}</span></div>
                         <div><span className="text-[10px] uppercase text-muted mr-2">Body:</span> <span className="font-bold text-sm" style={{ fontFamily: brandData.typography?.body }}>{brandData.typography?.body}</span></div>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants} className="mt-8 no-print">
        <SocialFeedPreview brandData={brandData} />
      </motion.div>

    </motion.div>
  );
};

export default BrandKitPage;
