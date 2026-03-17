import React from 'react';

/**
 * TemplateRenderer
 * A reusable engine to render visual brand assets.
 * 
 * @param {string} type - 'quote', 'reel_cover', 'story', 'carousel'
 * @param {object} brandData - Contains colors, typography, logos
 * @param {string} text - Main heading or content text
 * @param {string} layout - 'centered', 'top-left', 'minimal', 'bold'
 */
const DEFAULT_BRAND = {
  brandName: 'Kreavia',
  brandArchetype: 'The Visionary',
  colors: { primary: '#1A1A1A', accent: '#C6A96B', highlight: '#F5F5F7', secondary: '#FBFBFD' },
  typography: { headline: 'Playfair Display', body: 'Inter', ui: 'Satoshi' },
  logos: [],
};

const TemplateRenderer = ({ type, brandData: rawBrand, text, layout = 'centered' }) => {
  const brandData = rawBrand || DEFAULT_BRAND;

  const bg = brandData.colors?.highlight || '#F5F5F7';
  const accent = brandData.colors?.accent || '#C6A96B';
  const primary = brandData.colors?.primary || '#1A1A1A';
  const headlineFont = brandData.typography?.headline || 'Playfair Display';
  const bodyFont = brandData.typography?.body || 'Inter';

  const renderQuote = () => (
    <div 
      className="w-full h-full flex flex-col p-12 relative overflow-hidden"
      style={{ backgroundColor: bg }}
    >
      <div className="absolute top-10 left-10 text-6xl opacity-20 font-serif" style={{ color: accent }}>“</div>
      <div className={`flex-1 flex flex-col ${layout === 'centered' ? 'items-center justify-center text-center' : 'items-start justify-center text-left'}`}>
        <h2 
          className="text-3xl md:text-4xl font-bold leading-tight z-10"
          style={{ fontFamily: headlineFont, color: primary }}
        >
          {text || "The ultimate expression of simplicity is sophistication."}
        </h2>
        <div className="w-12 h-1 bg-accent mt-8 rounded-full" style={{ backgroundColor: accent }}></div>
      </div>
      <div className="mt-auto flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-light overflow-hidden">
          {brandData.logos?.[0]?.url ? <img src={brandData.logos[0].url} alt="Logo" className="w-full h-full object-cover" /> : <div className="w-4 h-4 bg-accent rounded-full"></div>}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: primary, fontFamily: bodyFont }}>
          {brandData.brandName || "Brand"}
        </span>
      </div>
    </div>
  );

  const renderReelCover = () => (
    <div 
      className="w-full h-full flex flex-col relative overflow-hidden group"
      style={{ backgroundColor: primary }}
    >
      {/* Background flare */}
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-transparent"></div>
      
      <div className="flex-1 flex flex-col items-center justify-center text-center p-10 z-10">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-4">Original Series</span>
        <h2 
          className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none text-secondary drop-shadow-2xl"
          style={{ fontFamily: headlineFont }}
        >
          {text || "THE ART OF CREATION"}
        </h2>
        <div className="w-1 w-24 bg-accent mt-6 shadow-glow" style={{ backgroundColor: accent }}></div>
      </div>

      <div className="p-8 bg-black/20 backdrop-blur-sm flex items-center justify-between z-10">
        <span className="text-xs font-bold text-secondary/80" style={{ fontFamily: bodyFont }}>Season 01 • Ep 12</span>
        <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
            {brandData.logos?.[0]?.url ? <img src={brandData.logos[0].url} alt="Logo" className="w-6 h-6 object-contain" /> : <div className="w-3 h-3 bg-accent rounded-full"></div>}
        </div>
      </div>
    </div>
  );

  const renderStoryHighlight = () => (
    <div 
      className="w-full h-full flex flex-col items-center justify-center p-10 relative"
      style={{ backgroundColor: bg }}
    >
      <div 
        className="w-32 h-32 rounded-full border-4 border-white shadow-xl flex items-center justify-center overflow-hidden mb-6"
        style={{ borderColor: accent }}
      >
         <div className="w-full h-full bg-accent/10 flex items-center justify-center">
            {brandData.logos?.[0]?.url ? <img src={brandData.logos[0].url} alt="Logo" className="w-16 h-16 object-contain" /> : <span className="text-4xl text-accent font-bold">✨</span>}
         </div>
      </div>
      <h3 className="text-xl font-bold tracking-tight text-center" style={{ fontFamily: headlineFont, color: primary }}>
        {text || "Resources"}
      </h3>
      <div className="absolute bottom-0 inset-x-0 h-1" style={{ backgroundColor: accent }}></div>
    </div>
  );

  const renderCarousel = () => (
    <div 
      className="w-full h-full flex flex-col p-10 relative overflow-hidden"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <div className="flex justify-between items-center mb-10">
         <span className="text-[10px] font-black uppercase tracking-widest text-muted">01 / 05</span>
         <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] text-primary font-bold">→</div>
      </div>
      <div className="flex-1 flex flex-col">
        <h2 
          className="text-4xl font-bold leading-[1.1] mb-6"
          style={{ fontFamily: headlineFont, color: primary }}
        >
          {text || "3 Ways to Elevate Your Visual Output →"}
        </h2>
        <p className="text-sm opacity-70 leading-relaxed max-w-[280px]" style={{ fontFamily: bodyFont, color: primary }}>
            Consistency isn't about being perfect, it's about showing up with a recognizable DNA.
        </p>
      </div>
      <div className="mt-auto border-t border-light pt-6 flex items-center gap-4">
         <div className="w-10 h-10 rounded-xl bg-highlight flex items-center justify-center">
            {brandData.logos?.[0]?.url ? <img src={brandData.logos[0].url} alt="Logo" className="w-6 h-6 object-contain" /> : <div className="w-4 h-4 bg-accent rounded-full"></div>}
         </div>
         <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: primary }}>{brandData.brandName || "KREAVIA"}</span>
            <span className="text-[9px] text-muted font-bold">@official.{brandData.brandName?.toLowerCase() || 'brand'}</span>
         </div>
      </div>
    </div>
  );

  switch (type) {
    case 'quote': return renderQuote();
    case 'reel_cover': return renderReelCover();
    case 'story': return renderStoryHighlight();
    case 'carousel': return renderCarousel();
    default: return renderQuote();
  }
};

export default TemplateRenderer;
