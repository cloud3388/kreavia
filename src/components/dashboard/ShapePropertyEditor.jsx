import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  X, 
  ChevronRight, 
  ChevronDown, 
  Maximize2, 
  Move, 
  RotateCw, 
  Layers, 
  Eye, 
  Sparkles,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ShapePropertyEditor = ({ shapes = [], onUpdate }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const updateShape = (index, delta) => {
    const newShapes = [...shapes];
    newShapes[index] = { ...newShapes[index], ...delta };
    onUpdate(newShapes);
  };

  const removeShape = (index) => {
    const newShapes = shapes.filter((_, i) => i !== index);
    onUpdate(newShapes);
  };

  const addShape = () => {
    const newShape = {
      type: 'circle',
      size: 150,
      x: 50,
      y: 50,
      rotation: 0,
      opacity: 0.2,
      blur: 40,
      color: '#C6A96B'
    };
    onUpdate([...shapes, newShape]);
    setExpandedIndex(shapes.length);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <h3 style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#C6A96B' }}>Geometric Layers</h3>
         <button 
           onClick={addShape}
           style={{ padding: '8px', backgroundColor: 'rgba(198, 169, 107, 0.1)', color: '#C6A96B', borderRadius: '9999px', border: 'none', cursor: 'pointer' }}
         >
           <Plus size={16} />
         </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {shapes.length === 0 && (
          <div style={{ padding: '40px 20px', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
             <Layers size={32} style={{ marginBottom: '8px' }} />
             <span style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>No Layers Active</span>
          </div>
        )}
        
        {shapes.map((shape, idx) => (
          <div key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
            <div 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', cursor: 'pointer' }}
              onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
            >
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: shape.type === 'circle' ? '50%' : '4px', backgroundColor: 'rgba(198, 169, 107, 0.2)', border: '1px solid rgba(198, 169, 107, 0.4)' }}></div>
                  <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)' }}>{shape.type} {idx + 1}</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={(e) => { e.stopPropagation(); removeShape(idx); }} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', opacity: 0.6 }}><Trash2 size={14}/></button>
                  {expandedIndex === idx ? <ChevronDown size={14} color="white"/> : <ChevronRight size={14} color="white"/>}
               </div>
            </div>

            <AnimatePresence>
              {expandedIndex === idx && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ padding: '0 20px 24px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}
                >
                   {/* Type Switch */}
                   <div style={{ display: 'flex', gap: '8px', padding: '4px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginTop: '16px' }}>
                      {['circle', 'square'].map(t => (
                        <button 
                          key={t}
                          onClick={() => updateShape(idx, { type: t })}
                          style={{ 
                            flex: 1, 
                            padding: '6px', 
                            borderRadius: '8px', 
                            fontSize: '9px', 
                            fontWeight: '900', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.1em', 
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: shape.type === t ? '#C6A96B' : 'transparent',
                            color: shape.type === t ? 'white' : 'rgba(255,255,255,0.4)'
                          }}
                        >
                          {t}
                        </button>
                      ))}
                   </div>

                   {/* Controls */}
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Color Control */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)' }}>
                            <Palette size={12} />
                            <span>Color</span>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'white' }}>{shape.color || '#C6A96B'}</span>
                            <input 
                              type="color" 
                              value={shape.color || '#C6A96B'}
                              onChange={(e) => updateShape(idx, { color: e.target.value })}
                              style={{ width: '24px', height: '24px', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: 0 }}
                            />
                         </div>
                      </div>

                      <ControlSlider 
                        label="Size" 
                        icon={<Maximize2 size={12}/>} 
                        value={shape.size} 
                        min={50} 
                        max={500} 
                        onChange={(v) => updateShape(idx, { size: v })} 
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <ControlSlider 
                          label="Pos X" 
                          icon={<Move size={12}/>} 
                          value={shape.x} 
                          min={0} 
                          max={100} 
                          onChange={(v) => updateShape(idx, { x: v })} 
                        />
                        <ControlSlider 
                          label="Pos Y" 
                          icon={<Move size={12}/>} 
                          value={shape.y} 
                          min={0} 
                          max={100} 
                          onChange={(v) => updateShape(idx, { y: v })} 
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <ControlSlider 
                          label="Rotate" 
                          icon={<RotateCw size={12}/>} 
                          value={shape.rotation} 
                          min={0} 
                          max={360} 
                          onChange={(v) => updateShape(idx, { rotation: v })} 
                        />
                        <ControlSlider 
                          label="Opacity" 
                          icon={<Eye size={12}/>} 
                          value={Math.round(shape.opacity * 100)} 
                          min={0} 
                          max={100} 
                          onChange={(v) => updateShape(idx, { opacity: v / 100 })} 
                        />
                      </div>
                      <ControlSlider 
                        label="Blur" 
                        icon={<Sparkles size={12}/>} 
                        value={shape.blur} 
                        min={0} 
                        max={100} 
                        onChange={(v) => updateShape(idx, { blur: v })} 
                      />
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

const ControlSlider = ({ label, icon, value, min, max, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           {icon}
           <span>{label}</span>
        </div>
        <span style={{ color: '#C6A96B' }}>{value}</span>
     </div>
     <input 
       type="range" 
       min={min} 
       max={max} 
       value={value} 
       onChange={(e) => onChange(parseInt(e.target.value))}
       style={{ width: '100%', height: '4px', borderRadius: '2px', cursor: 'pointer', accentColor: '#C6A96B' }}
     />
  </div>
);

export default ShapePropertyEditor;
