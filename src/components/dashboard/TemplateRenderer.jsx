import React from 'react';
import RichTextEditor from './RichTextEditor';

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

const TemplateRenderer = ({ 
  type, 
  brandData: rawBrand, 
  text, 
  onUpdateText,
  subHeadline,
  onUpdateSubHeadline,
  badgeText,
  onUpdateBadgeText,
  extraBody,
  onUpdateExtraBody,
  layout = 'centered',
  selectedElementId,
  onSelectId 
}) => {
  const brandData = rawBrand || DEFAULT_BRAND;

  const bg = brandData.colors?.highlight || '#F5F5F7';
  const accent = brandData.colors?.accent || '#C6A96B';
  const primary = brandData.colors?.primary || '#1A1A1A';
  const secondary = brandData.colors?.secondary || '#FBFBFD';
  const headlineFont = brandData.typography?.headline || 'Playfair Display';
  const bodyFont = brandData.typography?.body || 'Inter';
  const customTextColor = brandData.typography?.color;
  const overrideBg = brandData.colors?.backgroundOverride;
  const bgOpacity = brandData.bgOpacity !== undefined ? brandData.bgOpacity : 0.6;

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
      style={{ background: overrideBg || bg }}
    >
      {/* Background Image / Custom BG */}
      {(brandData.customBg || brandData.imageUrl) && (
        <div className="absolute inset-0 z-0">
          {(brandData.customBg || brandData.imageUrl).includes('transparenttextures.com') ? (
             <div className="w-full h-full mix-blend-multiply" style={{ backgroundImage: `url(${brandData.customBg || brandData.imageUrl})`, backgroundRepeat: 'repeat', opacity: bgOpacity }} />
          ) : (
             <img src={brandData.customBg || brandData.imageUrl} alt="" className="w-full h-full object-cover mix-blend-multiply" style={{ opacity: bgOpacity }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>
      )}

      {renderShapes()}

      <div className={`flex-1 flex flex-col z-10 ${layout === 'centered' ? 'items-center justify-center text-center' : 'items-start justify-center text-left'}`}>
        <div 
          className="text-3xl md:text-5xl font-bold leading-tight"
          style={{ width: '100%', fontFamily: headlineFont, color: customTextColor || ((brandData.customBg || brandData.imageUrl) ? '#FFFFFF' : primary) }}
        >
          <RichTextEditor 
             element={{ id: 'main-text', content: text || "The ultimate expression of simplicity is sophistication.", fontSize: 48, fontFamily: headlineFont }}
             brandData={brandData}
             isSelected={selectedElementId === 'main-text'}
             onSelect={() => onSelectId && onSelectId('main-text')}
             onUpdate={(el) => onUpdateText && onUpdateText(el.content)}
          />
        </div>
        {brandData.tagline && (
          <div className="mt-4 text-xl font-medium opacity-90" style={{ width: '100%', color: (brandData.customBg || brandData.imageUrl) ? '#FFFFFF' : accent, fontFamily: bodyFont }}>
             <RichTextEditor 
               element={{ id: 'sub-text', content: brandData.tagline, fontSize: 20, fontFamily: bodyFont }}
               brandData={brandData}
               isSelected={selectedElementId === 'sub-text'}
               onSelect={() => onSelectId && onSelectId('sub-text')}
               onUpdate={(el) => onUpdateSubHeadline && onUpdateSubHeadline(el.content)}
             />
          </div>
        )}
        <div className="w-16 h-1.5 bg-accent mt-10 rounded-full" style={{ backgroundColor: accent }}></div>
      </div>

      <div className="absolute bottom-10 inset-x-0 flex justify-center z-10 w-full opacity-80">
         <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: customTextColor || ((brandData.customBg || brandData.imageUrl) ? '#FFFFFF' : primary), fontFamily: bodyFont }}>
            {brandData.brandName || 'Kreavia Vision'}
         </span>
      </div>
    </div>
  );

  const renderReelCover = () => (
    <div 
      id="template-canvas"
      className="w-full h-full flex flex-col relative overflow-hidden group"
      style={{ background: overrideBg || primary }}
    >
      {/* Background flare / Custom BG */}
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/30 to-transparent"></div>
      
      {(brandData.customBg || brandData.imageUrl) && (
        <img src={brandData.customBg || brandData.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay" style={{ opacity: bgOpacity }} />
      )}

      {renderShapes()}
      
      <div className="flex-1 flex flex-col items-center justify-center text-center p-10 z-10">
        <span className="text-[11px] font-black uppercase tracking-[0.4em] mb-6" style={{ color: accent }}>Premium Series</span>
        <div 
          className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none drop-shadow-2xl"
          style={{ width: '100%', fontFamily: headlineFont, color: customTextColor || secondary }}
        >
          <RichTextEditor 
             element={{ id: 'main-text', content: text || "THE ART OF CREATION", fontSize: 72, fontFamily: headlineFont, align: 'center' }}
             brandData={brandData}
             isSelected={selectedElementId === 'main-text'}
             onSelect={() => onSelectId && onSelectId('main-text')}
             onUpdate={(el) => onUpdateText && onUpdateText(el.content)}
          />
        </div>
        <div className="w-32 h-1.5 bg-accent mt-8 shadow-glow" style={{ backgroundColor: accent }}></div>
      </div>

      <div className="absolute bottom-10 inset-x-0 flex justify-center z-10 w-full opacity-80">
         <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: customTextColor || ((brandData.customBg || brandData.imageUrl) ? '#FFFFFF' : primary), fontFamily: bodyFont }}>
            {brandData.brandName || 'Kreavia Vision'}
         </span>
      </div>
    </div>
  );

  const renderStoryHighlight = () => (
    <div 
      id="template-canvas"
      className="w-full h-full flex flex-col items-center justify-center p-12 relative overflow-hidden"
      style={{ background: overrideBg || bg }}
    >
      {(brandData.customBg || brandData.imageUrl) && (
        (brandData.customBg || brandData.imageUrl).includes('transparenttextures.com') ? (
          <div className="absolute inset-0 w-full h-full mix-blend-multiply" style={{ backgroundImage: `url(${brandData.customBg || brandData.imageUrl})`, backgroundRepeat: 'repeat', opacity: bgOpacity }} />
        ) : (
          <img src={brandData.customBg || brandData.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover mix-blend-multiply" style={{ opacity: bgOpacity }} />
        )
      )}
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
      <div className="text-2xl font-black tracking-widest text-center uppercase z-10 w-full" style={{ fontFamily: headlineFont, color: customTextColor || primary }}>
        <RichTextEditor 
           element={{ id: 'main-text', content: text || "Resources", fontSize: 24, fontFamily: headlineFont, align: 'center' }}
           brandData={brandData}
           isSelected={selectedElementId === 'main-text'}
           onSelect={() => onSelectId && onSelectId('main-text')}
           onUpdate={(el) => onUpdateText && onUpdateText(el.content)}
        />
      </div>
      <div className="absolute bottom-0 inset-x-0 h-2 bg-accent" style={{ backgroundColor: accent }}></div>
    </div>
  );

  const renderCarousel = () => (
    <div 
      id="template-canvas"
      className="w-full h-full flex flex-col p-12 relative overflow-hidden"
      style={{ background: overrideBg || secondary }}
    >
      {(brandData.customBg || brandData.imageUrl) && (
        <img src={brandData.customBg || brandData.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay" style={{ opacity: bgOpacity }} />
      )}
      {renderShapes()}

      <div className="flex justify-between items-center mb-12 z-10">
         <span className="text-[11px] font-black uppercase tracking-[0.3em] text-muted/60">01 / 05</span>
         <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-[11px] text-primary font-bold shadow-md" style={{ backgroundColor: accent, color: bg }}>→</div>
      </div>
      <div className="flex-1 flex flex-col z-10">
        <div 
          className="text-4xl md:text-5xl font-black leading-[1.05] mb-8 tracking-tight w-full"
          style={{ fontFamily: headlineFont, color: customTextColor || primary }}
        >
          <RichTextEditor 
             element={{ id: 'main-text', content: text || "3 Ways to Elevate Your Visual Output →", fontSize: 48, fontFamily: headlineFont, align: 'left' }}
             brandData={brandData}
             isSelected={selectedElementId === 'main-text'}
             onSelect={() => onSelectId && onSelectId('main-text')}
             onUpdate={(el) => onUpdateText && onUpdateText(el.content)}
          />
        </div>
        <div className="text-base opacity-70 leading-relaxed font-medium" style={{ width: '320px', fontFamily: bodyFont, color: customTextColor || primary }}>
          <RichTextEditor 
             element={{ id: 'sub-text', content: subHeadline || "Consistency isn't about being perfect, it's about showing up with a recognizable DNA.", fontSize: 16, fontFamily: bodyFont, align: 'left' }}
             brandData={brandData}
             isSelected={selectedElementId === 'sub-text'}
             onSelect={() => onSelectId && onSelectId('sub-text')}
             onUpdate={(el) => onUpdateSubHeadline && onUpdateSubHeadline(el.content)}
          />
        </div>
      </div>

      <div className="absolute bottom-10 inset-x-0 flex justify-center z-10 w-full opacity-80">
         <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: customTextColor || ((brandData.customBg || brandData.imageUrl) ? '#FFFFFF' : primary), fontFamily: bodyFont }}>
            {brandData.brandName || 'Kreavia Vision'}
         </span>
      </div>
    </div>
  );

  const renderEducational = () => (
    <div 
      id="template-canvas"
      className="w-full h-full flex flex-col p-10 relative overflow-hidden"
      style={{ background: overrideBg || bg }}
    >
      {(brandData.customBg || brandData.imageUrl) && (
        (brandData.customBg || brandData.imageUrl).includes('transparenttextures.com') ? (
          <div className="absolute inset-0 w-full h-full mix-blend-multiply z-0" style={{ backgroundImage: `url(${brandData.customBg || brandData.imageUrl})`, backgroundRepeat: 'repeat', opacity: bgOpacity }} />
        ) : (
          <img src={brandData.customBg || brandData.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover mix-blend-multiply z-0" style={{ opacity: bgOpacity }} />
        )
      )}
      <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 rounded-full -mr-24 -mt-24 blur-3xl" style={{ backgroundColor: `${accent}33` }}></div>
      
      {renderShapes()}

      <div className="z-10 bg-accent text-primary self-start px-2 py-1 rounded-full text-[11px] font-black uppercase tracking-[0.2em] mb-8 shadow-sm" style={{ backgroundColor: accent, color: bg, minWidth: '100px' }}>
        <RichTextEditor 
           element={{ id: 'badge-text', content: badgeText || "Pro Wisdom", fontSize: 11, fontFamily: bodyFont, align: 'center' }}
           brandData={brandData}
           isSelected={selectedElementId === 'badge-text'}
           onSelect={() => onSelectId && onSelectId('badge-text')}
           onUpdate={(el) => onUpdateBadgeText && onUpdateBadgeText(el.content)}
        />
      </div>
      <div 
        className="text-3xl md:text-4xl font-black leading-tight mb-10 z-10 w-full"
        style={{ fontFamily: headlineFont, color: customTextColor || primary }}
      >
        <RichTextEditor 
           element={{ id: 'main-text', content: text || "How to maintain brand consistency across all platforms.", fontSize: 36, fontFamily: headlineFont, align: 'left' }}
           brandData={brandData}
           isSelected={selectedElementId === 'main-text'}
           onSelect={() => onSelectId && onSelectId('main-text')}
           onUpdate={(el) => onUpdateText && onUpdateText(el.content)}
        />
      </div>
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
      <div className="absolute bottom-10 inset-x-0 flex justify-center z-10 w-full opacity-80">
         <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: customTextColor || ((brandData.customBg || brandData.imageUrl) ? '#FFFFFF' : primary), fontFamily: bodyFont }}>
            {brandData.brandName || 'Kreavia Vision'}
         </span>
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
