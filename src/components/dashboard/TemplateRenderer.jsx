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
  const secondary = brandData.colors?.secondary || '#FBFBFD';
  const headlineFont = brandData.typography?.headline || 'Playfair Display';
  const bodyFont = brandData.typography?.body || 'Inter';

  const renderShapes = () => {
    if (!brandData.shapes || !Array.isArray(brandData.shapes)) return null;
    return brandData.shapes.map((shape, idx) => (
      <div 
        key={idx}
        className="absolute pointer-events-none"
        style={{
          width: shape.size || 100,
          height: shape.size || 100,
          left: `${shape.x || 0}%`,
          top: `${shape.y || 0}%`,
          backgroundColor: shape.color || accent,
          borderRadius: shape.type === 'circle' ? '50%' : '0%',
          opacity: shape.opacity || 0.2,
          transform: `rotate(${shape.rotation || 0}deg) translate(-50%, -50%)`,
          filter: shape.blur ? `blur(${shape.blur}px)` : 'none',
          zIndex: 5
        }}
      />
    ));
  };

  const renderQuote = () => (
    <div 
      id="template-canvas"
      className="w-full h-full flex flex-col p-12 relative overflow-hidden"
      style={{ backgroundColor: bg }}
    >
      {/* Background Image / Custom BG */}
      {(brandData.customBg || brandData.imageUrl) && (
        <div className="absolute inset-0 z-0">
          <img src={brandData.customBg || brandData.imageUrl} alt="" className="w-full h-full object-cover opacity-60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>
      )}

      {renderShapes()}

      <div className="absolute top-10 left-10 text-6xl opacity-20 font-serif z-10" style={{ color: accent }}>“</div>
      <div className={`flex-1 flex flex-col z-10 ${layout === 'centered' ? 'items-center justify-center text-center' : 'items-start justify-center text-left'}`}>
        <h2 
          className="text-3xl md:text-5xl font-bold leading-tight"
          style={{ fontFamily: headlineFont, color: (brandData.customBg || brandData.imageUrl) ? '#FFFFFF' : primary }}
        >
          {text || "The ultimate expression of simplicity is sophistication."}
        </h2>
        {brandData.tagline && (
          <p className="mt-4 text-xl font-medium opacity-90" style={{ color: (brandData.customBg || brandData.imageUrl) ? '#FFFFFF' : accent, fontFamily: bodyFont }}>
             {brandData.tagline}
          </p>
        )}
        <div className="w-16 h-1.5 bg-accent mt-10 rounded-full" style={{ backgroundColor: accent }}></div>
      </div>

      <div className="mt-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-light overflow-hidden shadow-sm">
            {(brandData.productImage || brandData.logos?.[0]?.url) ? (
                <img src={brandData.productImage || brandData.logos[0].url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
                <div className="w-5 h-5 bg-accent rounded-full"></div>
            )}
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest opacity-80" style={{ color: (brandData.customBg || brandData.imageUrl) ? '#FFFFFF' : primary, fontFamily: bodyFont }}>
            {brandData.brandName || "Brand"}
            </span>
        </div>
        {(brandData.customBg || brandData.imageUrl) && (
             <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                <span className="text-white text-xs">✦</span>
             </div>
        )}
      </div>
    </div>
  );

  const renderReelCover = () => (
    <div 
      id="template-canvas"
      className="w-full h-full flex flex-col relative overflow-hidden group"
      style={{ backgroundColor: primary }}
    >
      {/* Background flare / Custom BG */}
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/30 to-transparent"></div>
      
      {(brandData.customBg || brandData.imageUrl) && (
        <img src={brandData.customBg || brandData.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay" />
      )}

      {renderShapes()}
      
      <div className="flex-1 flex flex-col items-center justify-center text-center p-10 z-10">
        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-accent mb-6">Premium Series</span>
        <h2 
          className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none text-secondary drop-shadow-2xl"
          style={{ fontFamily: headlineFont }}
        >
          {text || "THE ART OF CREATION"}
        </h2>
        <div className="w-32 h-1.5 bg-accent mt-8 shadow-glow" style={{ backgroundColor: accent }}></div>
      </div>

      <div className="p-8 bg-black/40 backdrop-blur-md border-t border-white/10 flex items-center justify-between z-10">
        <span className="text-xs font-black tracking-widest text-secondary/80 uppercase" style={{ fontFamily: bodyFont }}>Vol. 2026 • Edition 01</span>
        <div className="w-12 h-12 rounded-xl border border-white/30 flex items-center justify-center bg-white/5">
            {(brandData.productImage || brandData.logos?.[0]?.url) ? (
                <img src={brandData.productImage || brandData.logos[0].url} alt="Logo" className="w-8 h-8 object-contain" />
            ) : (
                <div className="w-4 h-4 bg-accent rounded-full"></div>
            )}
        </div>
      </div>
    </div>
  );

  const renderStoryHighlight = () => (
    <div 
      id="template-canvas"
      className="w-full h-full flex flex-col items-center justify-center p-12 relative overflow-hidden"
      style={{ backgroundColor: bg }}
    >
      {renderShapes()}

      <div 
        className="w-40 h-40 rounded-full border-8 border-white shadow-2xl flex items-center justify-center overflow-hidden mb-8 z-10"
        style={{ borderColor: accent }}
      >
         <div className="w-full h-full bg-accent/5 flex items-center justify-center">
            {(brandData.productImage || brandData.logos?.[0]?.url) ? (
                <img src={brandData.productImage || brandData.logos[0].url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
                <span className="text-6xl text-accent font-black">✦</span>
            )}
         </div>
      </div>
      <h3 className="text-2xl font-black tracking-widest text-center uppercase z-10" style={{ fontFamily: headlineFont, color: primary }}>
        {text || "Resources"}
      </h3>
      <div className="absolute bottom-0 inset-x-0 h-2 bg-accent" style={{ backgroundColor: accent }}></div>
    </div>
  );

  const renderCarousel = () => (
    <div 
      id="template-canvas"
      className="w-full h-full flex flex-col p-12 relative overflow-hidden"
      style={{ backgroundColor: secondary }}
    >
      {renderShapes()}

      <div className="flex justify-between items-center mb-12 z-10">
         <span className="text-[11px] font-black uppercase tracking-[0.3em] text-muted/60">01 / 05</span>
         <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-[11px] text-primary font-bold shadow-md" style={{ backgroundColor: accent, color: bg }}>→</div>
      </div>
      <div className="flex-1 flex flex-col z-10">
        <h2 
          className="text-4xl md:text-5xl font-black leading-[1.05] mb-8 tracking-tight"
          style={{ fontFamily: headlineFont, color: primary }}
        >
          {text || "3 Ways to Elevate Your Visual Output →"}
        </h2>
        <p className="text-base opacity-70 leading-relaxed max-w-[320px] font-medium" style={{ fontFamily: bodyFont, color: primary }}>
            Consistency isn't about being perfect, it's about showing up with a recognizable DNA.
        </p>
      </div>

      <div className="mt-auto border-t border-light/50 pt-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-highlight flex items-center justify-center border border-light/20 shadow-sm" style={{ backgroundColor: bg }}>
                {(brandData.productImage || brandData.logos?.[0]?.url) ? (
                    <img src={brandData.productImage || brandData.logos[0].url} alt="Logo" className="w-10 h-10 object-contain" />
                ) : (
                    <div className="w-5 h-5 bg-accent rounded-full" style={{ backgroundColor: accent }}></div>
                )}
            </div>
            <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: primary }}>{brandData.brandName || "KREAVIA"}</span>
                <span className="text-[10px] text-muted font-bold">@official.{brandData.brandName?.toLowerCase() || 'brand'}</span>
            </div>
        </div>
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ backgroundColor: accent }}></div>
      </div>
    </div>
  );

  const renderEducational = () => (
    <div 
      id="template-canvas"
      className="w-full h-full flex flex-col p-10 relative overflow-hidden"
      style={{ backgroundColor: bg }}
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 rounded-full -mr-24 -mt-24 blur-3xl" style={{ backgroundColor: `${accent}33` }}></div>
      
      {renderShapes()}

      <div className="z-10 bg-accent text-primary self-start px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] mb-8 shadow-sm" style={{ backgroundColor: accent, color: bg }}>
        Pro Wisdom
      </div>
      <h2 
        className="text-3xl md:text-4xl font-black leading-tight mb-10 z-10"
        style={{ fontFamily: headlineFont, color: primary }}
      >
        {text || "How to maintain brand consistency across all platforms."}
      </h2>
      <div className="flex flex-col gap-6 z-10">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-sm" style={{ border: `2px solid ${accent}`, color: accent, backgroundColor: 'white' }}>{i}</div>
            <div className="h-3 w-full bg-white border border-light rounded-full overflow-hidden shadow-inner">
               <div className="h-full bg-accent" style={{ width: `${100 - (i * 20)}%`, backgroundColor: accent }}></div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto pt-8 flex items-center justify-between border-t border-light/50 z-10">
          <span className="text-[11px] font-black uppercase tracking-widest opacity-60" style={{ color: primary }}>{brandData.brandName || "Brand"}</span>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform" style={{ backgroundColor: primary }}>
             <span className="text-secondary text-base" style={{ color: bg }}>✧</span>
          </div>
      </div>
    </div>
  );

  switch (type) {
    case 'quote': return renderQuote();
    case 'reel_cover': return renderReelCover();
    case 'story': return renderStoryHighlight();
    case 'carousel': return renderCarousel();
    case 'educational': return renderEducational();
    default: return renderQuote();
  }
};

export default TemplateRenderer;
