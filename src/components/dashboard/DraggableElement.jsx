import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

const DraggableElement = ({
  element,
  brandData,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onBringForward,
  onSendBackward
}) => {
  const containerRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null);

  // Dragging state
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const elementStart = useRef({ x: 0, y: 0 });

  // Resizing state
  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Rotating state
  const isRotating = useRef(false);
  const rotateStart = useRef({ angle: 0, initialRotation: 0 });

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (isDragging.current) {
        // Calculate new X/Y percentages based on parent container
        const parent = containerRef.current?.parentElement;
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        
        const deltaX = e.clientX - dragStart.current.x;
        const deltaY = e.clientY - dragStart.current.y;
        
        const deltaXPercent = (deltaX / rect.width) * 100;
        const deltaYPercent = (deltaY / rect.height) * 100;

        onUpdate({
          ...element,
          x: elementStart.current.x + deltaXPercent,
          y: elementStart.current.y + deltaYPercent
        });
      } else if (isResizing.current) {
        const deltaX = e.clientX - resizeStart.current.x;
        const deltaY = e.clientY - resizeStart.current.y;
        
        // Uniform scaling based on the largest delta
        const delta = Math.max(deltaX, deltaY);
        const newWidth = Math.max(20, resizeStart.current.width + delta);
        const newHeight = Math.max(20, resizeStart.current.height + delta);
        
        onUpdate({
          ...element,
          width: newWidth,
          height: newHeight
        });
      } else if (isRotating.current) {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        // Add 90 because handle is at top (which is -90 deg from center)
        let rotation = angle + 90;
        
        // Optional snap to 45 deg angles
        if (e.shiftKey) {
            rotation = Math.round(rotation / 45) * 45;
        }

        onUpdate({
          ...element,
          rotation
        });
      }
    };

    const handlePointerUp = () => {
      isDragging.current = false;
      isResizing.current = false;
      isRotating.current = false;
    };

    if (isSelected) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isSelected, element, onUpdate]);

  // Click away to close context menu
  useEffect(() => {
    const handleClickAnywhere = () => setContextMenu(null);
    window.addEventListener('click', handleClickAnywhere);
    return () => window.removeEventListener('click', handleClickAnywhere);
  }, []);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    if (e.button === 2) return; // Right click handled by contextMenu
    
    onSelect();
    setContextMenu(null);
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    elementStart.current = { x: element.x, y: element.y };
  };

  const handleResizeDown = (e) => {
    e.stopPropagation();
    onSelect();
    isResizing.current = true;
    resizeStart.current = { 
      x: e.clientX, 
      y: e.clientY, 
      width: element.width, 
      height: element.height 
    };
  };

  const handleRotateDown = (e) => {
    e.stopPropagation();
    onSelect();
    isRotating.current = true;
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    setContextMenu({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
      style={{
        position: 'absolute',
        left: `${element.x}%`,
        top: `${element.y}%`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        transform: `translate(-50%, -50%) rotate(${element.rotation || 0}deg)`,
        zIndex: element.zIndex || 10,
        cursor: isDragging.current ? 'grabbing' : 'grab',
        userSelect: 'none',
        border: isSelected ? '1px dashed #C6A96B' : '1px solid transparent',
      }}
    >
      {/* Content Rendering */}
      <div 
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: element.color || '#000000',
          fontSize: `${element.height * 0.8}px`, // Scale emoji/icon based on container height
        }}
      >
        {element.type === 'text' ? (
          <div style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}>
            <RichTextEditor 
              element={element}
              brandData={brandData}
              isSelected={isSelected}
              onSelect={onSelect}
              onUpdate={onUpdate}
            />
          </div>
        ) : element.type === 'emoji' ? (
          <span style={{ lineHeight: 1 }}>{element.content}</span>
        ) : (
          <div style={{ width: '100%', height: '100%' }}>
             {/* The element.content is expected to be a string SVG or Lucide Icon Component. 
                 For simplicity we will inject Lucide icons via React.createElement if it's a component reference,
                 or use an SVG string. In TemplatesPage we'll pass the actual component. */}
             {element.iconName && React.createElement(element.iconName, { size: '100%', color: element.color || '#000000', fill: element.iconName?.render?.name?.includes('Circle') || element.iconName?.render?.name?.includes('Square') || element.iconName?.render?.name?.includes('Triangle') || element.iconName?.render?.name?.includes('Hexagon') ? (element.color || '#000000') : 'none' })}
          </div>
        )}
      </div>

      {isSelected && (
        <>
          {/* Delete Button */}
          <button
            onPointerDown={(e) => { e.stopPropagation(); onDelete(); }}
            style={{
              position: 'absolute',
              top: '-12px',
              right: '-12px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            <X size={14} />
          </button>

          {/* Resize Handle (Bottom Right) */}
          <div
            onPointerDown={handleResizeDown}
            style={{
              position: 'absolute',
              bottom: '-6px',
              right: '-6px',
              width: '12px',
              height: '12px',
              backgroundColor: '#C6A96B',
              borderRadius: '50%',
              cursor: 'nwse-resize',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }}
          />

          {/* Rotation Handle (Top Center) */}
          <div
            onPointerDown={handleRotateDown}
            style={{
              position: 'absolute',
              top: '-24px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '12px',
              height: '12px',
              backgroundColor: '#C6A96B',
              borderRadius: '50%',
              cursor: 'crosshair',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }}
          />
          {/* Line connecting rotation handle to box */}
          <div 
            style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '1px',
              height: '12px',
              backgroundColor: '#C6A96B'
            }}
          />
        </>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div 
          style={{
            position: 'absolute',
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            zIndex: 9999,
            minWidth: '120px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            color: 'white'
          }}
          onPointerDown={e => e.stopPropagation()} // Prevent dragging when clicking on menu
        >
          <button onClick={() => { onBringForward(); setContextMenu(null); }} style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '12px', borderRadius: '4px' }} onMouseEnter={e => e.target.style.backgroundColor = '#333'} onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}>Bring Forward</button>
          <button onClick={() => { onSendBackward(); setContextMenu(null); }} style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '12px', borderRadius: '4px' }} onMouseEnter={e => e.target.style.backgroundColor = '#333'} onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}>Send Back</button>
        </div>
      )}
    </div>
  );
};

export default DraggableElement;
