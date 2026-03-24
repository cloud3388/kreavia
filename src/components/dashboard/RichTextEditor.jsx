import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, Type, ChevronDown, TypeOutline, Baseline } from 'lucide-react';

const COMMON_FONTS = [
  'Inter', 'Poppins', 'Playfair Display', 'Montserrat', 'Oswald', 'Cormorant'
];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72];

const RichTextEditor = ({ 
  element,        // The canvasElement object
  brandData,      // To extract brand fonts and colors
  isSelected, 
  onSelect, 
  onUpdate 
}) => {
  const editorRef = useRef(null);
  const toolbarRef = useRef(null);
  
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);

  // Deriving Brand Fonts
  const brandFonts = [brandData?.typography?.headline, brandData?.typography?.body].filter(Boolean);
  const allFonts = [...new Set([...brandFonts, ...COMMON_FONTS])];

  // Local Selection State for Toolbar highlighting
  const [activeStyles, setActiveStyles] = useState({
    font: element.fontFamily || 'Inter',
    size: element.fontSize || 36,
    align: element.align || 'center',
    lineHeight: element.lineHeight || 1.2
  });

  // Sync initial content only once or when element changes externally
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== element.content) {
      editorRef.current.innerHTML = element.content || '<p>Type something...</p>';
    }
  }, [element.id]); // only re-run if it's a completely different element

  // Toolbar positioning
  useEffect(() => {
    if (isSelected) {
      setShowToolbar(true);
      positionToolbar();
    } else {
      setShowToolbar(false);
      setShowFontDropdown(false);
      setShowSizeDropdown(false);
    }
  }, [isSelected]);

  const positionToolbar = () => {
    if (!editorRef.current) return;
    const rect = editorRef.current.getBoundingClientRect();
    // Position toolbar directly above the text box
    // Because we use a portal now, rect.top/left are screen coordinates and perfectly map.
    setToolbarPos({
      top: rect.top - 60, // 60px above
      left: rect.left + rect.width / 2
    });
  };

  useEffect(() => {
    if (showToolbar) {
      window.addEventListener('resize', positionToolbar);
      window.addEventListener('scroll', positionToolbar, true);
      return () => {
        window.removeEventListener('resize', positionToolbar);
        window.removeEventListener('scroll', positionToolbar, true);
      };
    }
  }, [showToolbar]);

  const updateContent = () => {
    if (!editorRef.current) return;
    onUpdate({
      ...element,
      content: editorRef.current.innerHTML,
      fontFamily: activeStyles.font,
      fontSize: activeStyles.size,
      align: activeStyles.align,
      lineHeight: activeStyles.lineHeight
    });
    positionToolbar();
  };

  const handleInput = () => {
    updateContent();
  };

  const exec = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  const toggleUppercase = () => {
    // Hack wrapper passing via precise font size 6
    document.execCommand('fontSize', false, '6');
    const fonts = document.querySelectorAll('font[size="6"]');
    fonts.forEach(f => {
      f.removeAttribute('size');
      f.style.textTransform = f.style.textTransform === 'uppercase' ? 'none' : 'uppercase';
    });
    updateContent();
  };

  const changeFontSize = (sizePx) => {
    document.execCommand('fontSize', false, '7');
    const fonts = document.querySelectorAll('font[size="7"]');
    fonts.forEach(f => {
      f.removeAttribute('size');
      f.style.fontSize = sizePx + 'px';
    });
    setActiveStyles(prev => ({ ...prev, size: sizePx }));
    updateContent();
    setShowSizeDropdown(false);
  };

  const changeFontFamily = (font) => {
    document.execCommand('fontName', false, font);
    setActiveStyles(prev => ({ ...prev, font }));
    updateContent();
    setShowFontDropdown(false);
  };

  const handleBlur = (e) => {
    // If we click into the toolbar, do NOT deselect
    if (toolbarRef.current?.contains(e.relatedTarget)) {
      return;
    }
    // We let TemplatesPage handle total deselection
  };

  const handleKeyDown = (e) => {
    // Automatically grow height natively by contentEditable, 
    // but we intercept Enter to ensure it adds a br/div smoothly
    if (e.key === 'Enter') {
      // document.execCommand('insertLineBreak') is often better than default <div> wrapping
      // but let's just let native contentEditable handle it natively for seamless growth
      setTimeout(updateContent, 10);
      positionToolbar();
    }
  };

  return (
    <>
      <div 
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onPointerDown={(e) => { e.stopPropagation(); onSelect(); }}
        onInput={handleInput}
        onBlur={handleBlur}
        onKeyUp={(e) => { positionToolbar(); setActiveStyles({...activeStyles}); }}
        onMouseUp={() => { positionToolbar(); setActiveStyles({...activeStyles}); }}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          minHeight: '40px',
          outline: isSelected ? '2px dashed #C6A96B' : 'none',
          padding: '8px',
          fontFamily: activeStyles.font, // Default fallback font
          fontSize: activeStyles.size + 'px', // Default fallback size
          textAlign: activeStyles.align,
          lineHeight: activeStyles.lineHeight,
          color: element.color || brandData?.colors?.primary || '#1A1A1A',
          cursor: isSelected ? 'text' : 'grab',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap'
        }}
      />

      {/* Floating Toolbar Portal properly hoisted out of nested CSS transforms */}
      {showToolbar && typeof document !== 'undefined' && createPortal(
        <div 
          ref={toolbarRef}
          onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }} // prevent blur
          style={{
            position: 'fixed',
            top: toolbarPos.top + 'px',
            left: toolbarPos.left + 'px',
            transform: 'translateX(-50%)',
            backgroundColor: '#1A1A1A',
            borderRadius: '12px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            zIndex: 999999, // Super high to float above everything
          }}
        >
          {/* Font Family Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowFontDropdown(!showFontDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'white', fontSize: '12px', fontFamily: activeStyles.font, cursor: 'pointer' }}
            >
              <Type size={14} /> {activeStyles.font.slice(0, 10)} <ChevronDown size={10} />
            </button>
            {showFontDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', backgroundColor: '#222', border: '1px solid #333', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {allFonts.map(f => (
                  <button key={f} onClick={() => changeFontFamily(f)} style={{ padding: '8px 16px', background: 'none', border: 'none', color: 'white', fontFamily: f, textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap' }} onMouseOver={e=>e.target.style.backgroundColor='#333'} onMouseOut={e=>e.target.style.backgroundColor='transparent'}>
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

          {/* Font Size Selector */}
          <div style={{ position: 'relative' }}>
             <button 
              onClick={() => setShowSizeDropdown(!showSizeDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'white', fontSize: '12px', cursor: 'pointer' }}
            >
              {activeStyles.size} <ChevronDown size={10} />
            </button>
            {showSizeDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', backgroundColor: '#222', border: '1px solid #333', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {FONT_SIZES.map(s => (
                  <button key={s} onClick={() => changeFontSize(s)} style={{ padding: '6px 16px', background: 'none', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer' }} onMouseOver={e=>e.target.style.backgroundColor='#333'} onMouseOut={e=>e.target.style.backgroundColor='transparent'}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

          {/* Font Weights & Styles */}
          <div style={{ display: 'flex', gap: '4px' }}>
             <button onClick={() => exec('bold')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', borderRadius: '4px' }} onMouseOver={e=>e.target.style.backgroundColor='rgba(255,255,255,0.1)'} onMouseOut={e=>e.target.style.backgroundColor='transparent'}><Bold size={14} /></button>
             <button onClick={() => exec('italic')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', borderRadius: '4px' }} onMouseOver={e=>e.target.style.backgroundColor='rgba(255,255,255,0.1)'} onMouseOut={e=>e.target.style.backgroundColor='transparent'}><Italic size={14} /></button>
             <button onClick={toggleUppercase} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', borderRadius: '4px' }} onMouseOver={e=>e.target.style.backgroundColor='rgba(255,255,255,0.1)'} onMouseOut={e=>e.target.style.backgroundColor='transparent'}><TypeOutline size={14} /></button>
          </div>

          <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

          {/* Alignment */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => { setActiveStyles(prev => ({...prev, align: 'left'})); updateContent(); }} style={{ background: activeStyles.align === 'left' ? 'rgba(255,255,255,0.2)' : 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}><AlignLeft size={14} /></button>
            <button onClick={() => { setActiveStyles(prev => ({...prev, align: 'center'})); updateContent(); }} style={{ background: activeStyles.align === 'center' ? 'rgba(255,255,255,0.2)' : 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}><AlignCenter size={14} /></button>
            <button onClick={() => { setActiveStyles(prev => ({...prev, align: 'right'})); updateContent(); }} style={{ background: activeStyles.align === 'right' ? 'rgba(255,255,255,0.2)' : 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}><AlignRight size={14} /></button>
          </div>

          <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

          {/* Color Picker Array */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
             {[brandData?.colors?.primary, brandData?.colors?.accent, brandData?.colors?.secondary].filter(Boolean).map(c => (
               <button key={c} onClick={() => exec('foreColor', c)} style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: c, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }} />
             ))}
             <div style={{ position: 'relative', width: '16px', height: '16px', borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)', marginLeft: '4px' }}>
               <input type="color" onChange={(e) => exec('foreColor', e.target.value)} style={{ position: 'absolute', top: '-10px', left: '-10px', width: '40px', height: '40px', cursor: 'pointer' }} />
             </div>
          </div>

          <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

          {/* Line Height */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
             <Baseline size={14} color="rgba(255,255,255,0.5)" />
             <input 
               type="range" min="1" max="2" step="0.1" 
               value={activeStyles.lineHeight} 
               onChange={e => {
                 const newLh = parseFloat(e.target.value);
                 setActiveStyles(prev => ({...prev, lineHeight: newLh}));
                 updateContent();
               }} 
               style={{ width: '40px', accentColor: '#C6A96B' }} 
             />
             <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{activeStyles.lineHeight}</span>
          </div>

        </div>
      , document.body)}
    </>
  );
};

export default RichTextEditor;
