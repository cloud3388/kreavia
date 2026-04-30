import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Type, Wand2, Download, Check, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';



const GOOGLE_FONTS = [
  'Playfair Display', 'Inter', 'Satoshi', 'Montserrat', 'Lato',
  'Raleway', 'Oswald', 'Merriweather', 'Nunito', 'Poppins',
  'Cormorant Garamond', 'Josefin Sans', 'Libre Baskerville', 'DM Serif Display',
];

const TEXT_PRESETS = [
  { label: 'Brand Name', style: 'bold', size: 48 },
  { label: 'Tagline', style: 'italic', size: 28 },
  { label: 'Monogram', style: 'black', size: 72 },
];

export default function LogoEditorModal({ isOpen, onClose, brandData, onSave }) {
  const [activeTab, setActiveTab] = useState('ai');

  // AI Tab state
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [genError, setGenError] = useState(null);

  // Text Tab state
  const [textContent, setTextContent] = useState('');
  const [fontFamily, setFontFamily] = useState('Playfair Display');
  const [fontSize, setFontSize] = useState(48);
  const [fontStyle, setFontStyle] = useState('bold');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textX, setTextX] = useState(50); // percentage
  const [textY, setTextY] = useState(85); // percentage
  const [isSavingText, setIsSavingText] = useState(false);

  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);

  const brandName = brandData?.dna?.brand_name || brandData?.brandName || 'Brand';
  const currentLogoUrl = brandData?.logos?.[0]?.url || '';
  const palette = brandData?.colors || {};
  const typography = brandData?.typography || {};

  // Seed the default prompt
  useEffect(() => {
    if (isOpen) {
      const niche = brandData?.dna?.niche || 'premium brand';
      const style = brandData?.dna?.style || 'minimalist';
      setCustomPrompt(
        `A ${style} logo mark for a ${niche} brand called "${brandName}". ` +
        `Geometric abstract symbol, luxury aesthetic, ultra-minimal.`
      );
      setTextContent(brandName);
      setFontFamily(typography.headline || 'Playfair Display');
      setGeneratedUrl(null);
      setGenError(null);
    }
  }, [isOpen, brandData]);

  // Load Google Fonts for preview
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    const families = GOOGLE_FONTS.map(f => `family=${f.replace(/ /g, '+')}:wght@400;700;900`).join('&');
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
    document.head.appendChild(link);
    return () => { if (document.head.contains(link)) document.head.removeChild(link); };
  }, []);

  // Draw the text-overlay preview on canvas
  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 400;
    canvas.width = size;
    canvas.height = size;

    // Draw logo image as background
    if (currentLogoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        drawTextLayer(ctx, size);
      };
      img.onerror = () => {
        ctx.fillStyle = palette.primary || '#1A1A1A';
        ctx.fillRect(0, 0, size, size);
        drawTextLayer(ctx, size);
      };
      img.src = currentLogoUrl;
    } else {
      ctx.fillStyle = palette.primary || '#1A1A1A';
      ctx.fillRect(0, 0, size, size);
      drawTextLayer(ctx, size);
    }
  }, [currentLogoUrl, textContent, fontFamily, fontSize, fontStyle, textColor, textX, textY, palette]);

  const drawTextLayer = (ctx, size) => {
    if (!textContent) return;
    const weight = fontStyle === 'black' ? '900' : fontStyle === 'bold' ? '700' : '400';
    const style = fontStyle === 'italic' ? 'italic' : 'normal';
    ctx.font = `${style} ${weight} ${fontSize}px "${fontFamily}", serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Subtle shadow for legibility
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.fillText(textContent, (textX / 100) * size, (textY / 100) * size);
    ctx.shadowBlur = 0;
  };

  useEffect(() => {
    if (activeTab === 'text') drawPreview();
  }, [activeTab, drawPreview]);

  const handleGenerate = async () => {
    if (!customPrompt.trim()) return;
    setIsGenerating(true);
    setGenError(null);
    setGeneratedUrl(null);

    const primary = palette?.primary || '#1A1A1A';
    const accent  = palette?.accent  || '#C6A96B';

    try {
      // Always route through the serverless endpoint — works locally (via Vite plugin)
      // and in production (Vercel). Keeps the API key server-side.
      const res = await fetch('/api/generate/custom-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: customPrompt, brandName, palette }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      const imageUrl = data.url || null;

      if (imageUrl) {
        setGeneratedUrl(imageUrl);
      } else {
        setGenError('No image returned. Please try again.');
      }
    } catch (err) {
      console.error('[LogoEditor] Generation failed:', err);
      setGenError(err.message || 'Failed to generate. Check your internet connection.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseGenerated = () => {
    if (!generatedUrl) return;
    onSave({ url: generatedUrl, model_used: 'custom-prompt' });
    onClose();
  };

  const handleSaveWithText = async () => {
    setIsSavingText(true);
    try {
      const canvas = previewCanvasRef.current;
      if (!canvas) return;
      // Ensure latest draw
      drawPreview();
      await new Promise(r => setTimeout(r, 300)); // wait for image load
      const dataUrl = canvas.toDataURL('image/png');
      onSave({ url: dataUrl, model_used: 'text-overlay' });
      onClose();
    } catch (err) {
      console.error('[LogoEditor] Save with text failed:', err);
    } finally {
      setIsSavingText(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(8px)',
              zIndex: 1000,
            }}
          />

          {/* Centering wrapper — handles positioning only, no transform */}
          <div style={{
            position: 'fixed', inset: 0,
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            pointerEvents: 'none',
          }}>
            {/* Animated modal — Framer Motion only does scale+opacity here, no conflicting transforms */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                width: '100%',
                maxWidth: '760px',
                maxHeight: '90vh',
                backgroundColor: '#fff',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                pointerEvents: 'all',
              }}
            >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '24px 32px',
              borderBottom: '1px solid rgba(0,0,0,0.07)',
              background: 'linear-gradient(135deg, #fafafa 0%, #fff 100%)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: 'linear-gradient(135deg, #1A1A1A, #3a3a3a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Wand2 size={18} color="#C6A96B" />
                </div>
                <div>
                  <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
                    Logo Editor
                  </h2>
                  <p style={{ fontSize: 12, color: '#86868B', margin: 0, marginTop: 2 }}>
                    Generate with AI or add custom text
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: '1px solid rgba(0,0,0,0.1)',
                  background: '#f5f5f7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#86868B',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#e5e5ea'}
                onMouseLeave={e => e.currentTarget.style.background = '#f5f5f7'}
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex', padding: '0 32px',
              borderBottom: '1px solid rgba(0,0,0,0.07)',
              background: '#fafafa',
            }}>
              {[
                { id: 'ai', label: 'AI Generate', icon: <Sparkles size={14} /> },
                { id: 'text', label: 'Add Text', icon: <Type size={14} /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '14px 20px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 13, fontWeight: 600,
                    color: activeTab === tab.id ? '#1A1A1A' : '#86868B',
                    borderBottom: `2px solid ${activeTab === tab.id ? '#C6A96B' : 'transparent'}`,
                    transition: 'all 0.15s ease',
                    marginBottom: -1,
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Body — scrollable */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 28px' }}>

              {/* ── AI GENERATE TAB ── */}
              {activeTab === 'ai' && (
                <div style={{ display: 'flex', gap: 28 }}>
                  {/* Left: Controls */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
                        Your Prompt
                      </label>
                      <textarea
                        value={customPrompt}
                        onChange={e => setCustomPrompt(e.target.value)}
                        placeholder="Describe your ideal logo..."
                        rows={6}
                        style={{
                          width: '100%', padding: '14px 16px',
                          background: '#f5f5f7',
                          border: '1.5px solid rgba(0,0,0,0.08)',
                          borderRadius: 12, fontFamily: 'Inter, sans-serif',
                          fontSize: 14, lineHeight: 1.6, color: '#1A1A1A',
                          resize: 'vertical', outline: 'none',
                          transition: 'border-color 0.15s',
                          boxSizing: 'border-box',
                        }}
                        onFocus={e => e.target.style.borderColor = '#C6A96B'}
                        onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.08)'}
                      />
                    </div>

                    <div style={{
                      padding: '12px 16px',
                      background: 'rgba(198, 169, 107, 0.06)',
                      border: '1px solid rgba(198, 169, 107, 0.2)',
                      borderRadius: 10,
                    }}>
                      <p style={{ fontSize: 12, color: '#86868B', margin: 0, lineHeight: 1.5 }}>
                        <strong style={{ color: '#C6A96B' }}>Tip:</strong> Be specific about style — e.g. <em>"geometric monogram"</em>, <em>"abstract leaf icon"</em>, <em>"lettermark in circles"</em>.
                      </p>
                    </div>

                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || !customPrompt.trim()}
                      style={{
                        padding: '14px 24px',
                        background: isGenerating || !customPrompt.trim() ? '#e5e5ea' : '#1A1A1A',
                        color: isGenerating || !customPrompt.trim() ? '#86868B' : '#fff',
                        border: 'none', borderRadius: 12,
                        fontWeight: 700, fontSize: 14, cursor: isGenerating ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isGenerating
                        ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                        : <><Sparkles size={16} /> Generate Logo</>
                      }
                    </button>

                    {genError && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '12px 16px', background: 'rgba(239,68,68,0.06)',
                        border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10,
                        color: '#ef4444', fontSize: 13,
                      }}>
                        <AlertCircle size={14} /> {genError}
                      </div>
                    )}
                  </div>

                  {/* Right: Preview */}
                  <div style={{ width: 200, flexShrink: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
                      Preview
                    </label>
                    <div style={{
                      width: 200, height: 200,
                      borderRadius: 16,
                      border: '1.5px solid rgba(0,0,0,0.08)',
                      background: '#f5f5f7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', position: 'relative',
                    }}>
                      {isGenerating && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'rgba(255,255,255,0.85)',
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 2,
                        }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            border: '3px solid #e5e5ea',
                            borderTopColor: '#C6A96B',
                            animation: 'spin 0.8s linear infinite',
                          }} />
                          <p style={{ fontSize: 12, color: '#86868B', margin: 0 }}>Generating with AI…</p>
                        </div>
                      )}
                      {generatedUrl ? (
                        <img
                          src={generatedUrl}
                          alt="Generated Logo"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#c5c5c7' }}>
                          <ImageIcon size={32} />
                          <span style={{ fontSize: 12 }}>Result appears here</span>
                        </div>
                      )}
                    </div>

                    {generatedUrl && !isGenerating && (
                      <button
                        onClick={handleUseGenerated}
                        style={{
                          marginTop: 12, width: '100%',
                          padding: '12px 16px',
                          background: '#C6A96B', color: '#fff',
                          border: 'none', borderRadius: 12,
                          fontWeight: 700, fontSize: 13, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#b5985c'}
                        onMouseLeave={e => e.currentTarget.style.background = '#C6A96B'}
                      >
                        <Check size={15} /> Use This Logo
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── TEXT TAB ── */}
              {activeTab === 'text' && (
                <div style={{ display: 'flex', gap: 28 }}>
                  {/* Left: Controls */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>

                    {/* Text Content */}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
                        Text
                      </label>
                      <input
                        type="text"
                        value={textContent}
                        onChange={e => { setTextContent(e.target.value); drawPreview(); }}
                        placeholder="Enter brand name, tagline..."
                        style={{
                          width: '100%', padding: '12px 14px',
                          background: '#f5f5f7',
                          border: '1.5px solid rgba(0,0,0,0.08)',
                          borderRadius: 10, fontFamily: 'Inter, sans-serif',
                          fontSize: 14, color: '#1A1A1A', outline: 'none',
                          transition: 'border-color 0.15s', boxSizing: 'border-box',
                        }}
                        onFocus={e => e.target.style.borderColor = '#C6A96B'}
                        onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.08)'}
                      />
                    </div>

                    {/* Quick Presets */}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
                        Style Preset
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {TEXT_PRESETS.map(p => (
                          <button
                            key={p.label}
                            onClick={() => { setFontStyle(p.style); setFontSize(p.size); drawPreview(); }}
                            style={{
                              padding: '8px 14px', borderRadius: 8,
                              border: '1.5px solid rgba(0,0,0,0.1)',
                              background: fontStyle === p.style && fontSize === p.size ? '#1A1A1A' : '#f5f5f7',
                              color: fontStyle === p.style && fontSize === p.size ? '#fff' : '#1A1A1A',
                              fontSize: 12, fontWeight: 600, cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Family */}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
                        Font
                      </label>
                      <select
                        value={fontFamily}
                        onChange={e => { setFontFamily(e.target.value); drawPreview(); }}
                        style={{
                          width: '100%', padding: '10px 14px',
                          background: '#f5f5f7',
                          border: '1.5px solid rgba(0,0,0,0.08)',
                          borderRadius: 10, fontFamily: 'Inter, sans-serif',
                          fontSize: 14, color: '#1A1A1A', outline: 'none',
                          cursor: 'pointer', boxSizing: 'border-box',
                        }}
                      >
                        {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>

                    {/* Font Size */}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
                        Size — <span style={{ color: '#1A1A1A' }}>{fontSize}px</span>
                      </label>
                      <input
                        type="range" min={12} max={120} value={fontSize}
                        onChange={e => { setFontSize(Number(e.target.value)); drawPreview(); }}
                        style={{ width: '100%', accentColor: '#C6A96B' }}
                      />
                    </div>

                    {/* Color */}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
                        Color
                      </label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        {['#FFFFFF', '#1A1A1A', '#C6A96B', palette?.accent || '#C6A96B', palette?.primary || '#1A1A1A'].filter((v, i, a) => a.indexOf(v) === i).map(c => (
                          <button
                            key={c}
                            onClick={() => { setTextColor(c); drawPreview(); }}
                            style={{
                              width: 32, height: 32, borderRadius: '50%', background: c,
                              border: textColor === c ? '3px solid #C6A96B' : '2px solid rgba(0,0,0,0.1)',
                              cursor: 'pointer', transition: 'all 0.15s',
                            }}
                          />
                        ))}
                        <input
                          type="color" value={textColor}
                          onChange={e => { setTextColor(e.target.value); drawPreview(); }}
                          style={{
                            width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.1)',
                            cursor: 'pointer', padding: 1,
                          }}
                        />
                      </div>
                    </div>

                    {/* Position */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
                          Horizontal — <span style={{ color: '#1A1A1A' }}>{textX}%</span>
                        </label>
                        <input type="range" min={5} max={95} value={textX}
                          onChange={e => { setTextX(Number(e.target.value)); drawPreview(); }}
                          style={{ width: '100%', accentColor: '#C6A96B' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
                          Vertical — <span style={{ color: '#1A1A1A' }}>{textY}%</span>
                        </label>
                        <input type="range" min={5} max={95} value={textY}
                          onChange={e => { setTextY(Number(e.target.value)); drawPreview(); }}
                          style={{ width: '100%', accentColor: '#C6A96B' }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSaveWithText}
                      disabled={isSavingText || !textContent.trim()}
                      style={{
                        padding: '14px 24px',
                        background: isSavingText || !textContent.trim() ? '#e5e5ea' : '#1A1A1A',
                        color: isSavingText || !textContent.trim() ? '#86868B' : '#fff',
                        border: 'none', borderRadius: 12,
                        fontWeight: 700, fontSize: 14,
                        cursor: isSavingText || !textContent.trim() ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'all 0.15s ease', marginTop: 4,
                      }}
                    >
                      {isSavingText
                        ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                        : <><Download size={16} /> Save with Text</>
                      }
                    </button>
                  </div>

                  {/* Right: Canvas Preview */}
                  <div style={{ width: 200, flexShrink: 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
                      Live Preview
                    </label>
                    <div style={{
                      width: 200, height: 200,
                      borderRadius: 16,
                      border: '1.5px solid rgba(0,0,0,0.08)',
                      overflow: 'hidden',
                    }}>
                      <canvas
                        ref={previewCanvasRef}
                        width={400} height={400}
                        style={{ width: '100%', height: '100%', display: 'block' }}
                      />
                    </div>
                    <p style={{ fontSize: 11, color: '#86868B', marginTop: 8, textAlign: 'center' }}>
                      Adjust controls to position your text
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
          </div>{/* end centering wrapper */}

          {/* Spin keyframe */}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </AnimatePresence>
  );
}
