import React, { useState, useRef, useEffect } from 'react';
import { Lock, X, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * LockedOverlay
 * Used for sections like Hashtag Strategy, Brand Voice, Version History.
 */
export const LockedOverlay = ({ benefit, onUpgrade }) => {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 50,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '40px',
      borderRadius: 'inherit'
    }}>
      <div style={{
        backgroundColor: '#C6A96B',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        color: 'white',
        boxShadow: '0 8px 24px rgba(198, 169, 107, 0.4)'
      }}>
        <Lock size={28} />
      </div>
      
      <h3 style={{ 
        fontSize: '24px', 
        fontWeight: '900', 
        color: 'white', 
        marginBottom: '8px',
        letterSpacing: '0.02em'
      }}>
        Pro Feature
      </h3>
      
      <p style={{ 
        fontSize: '15px', 
        color: 'rgba(255, 255, 255, 0.8)', 
        marginBottom: '32px',
        maxWidth: '320px',
        lineHeight: 1.5
      }}>
        {benefit}
      </p>
      
      <button 
        onClick={onUpgrade}
        style={{
          backgroundColor: '#C6A96B',
          color: 'white',
          border: 'none',
          padding: '14px 32px',
          borderRadius: '14px',
          fontWeight: '800',
          fontSize: '15px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 4px 20px rgba(198, 169, 107, 0.3)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(198, 169, 107, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(198, 169, 107, 0.3)';
        }}
      >
        Upgrade to Pro
      </button>
    </div>
  );
};

/**
 * LockedPopover
 * A contextual popover that appears when clicking a locked button.
 */
export const LockedPopover = ({ isOpen, onClose, benefit, onUpgrade, anchorRef }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 999999 }}>
        <div 
          onClick={onClose} 
          style={{ position: 'absolute', inset: 0, backgroundColor: 'transparent' }} 
        />
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          style={{
            position: 'absolute',
            top: anchorRef?.current?.getBoundingClientRect().top - 260 || '50%',
            left: anchorRef?.current?.getBoundingClientRect().left || '50%',
            transform: 'translateX(-50%)',
            width: '300px',
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 30px 60px rgba(0,0,0,0.25)',
            border: '1px solid rgba(0,0,0,0.05)',
            zIndex: 1000000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '50%', 
            backgroundColor: 'rgba(198, 169, 107, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#C6A96B', 
            marginBottom: '16px' 
          }}>
            <Lock size={22} strokeWidth={2.5} />
          </div>

          <h4 style={{ fontSize: '18px', fontWeight: '900', color: '#1a1a1a', marginBottom: '8px' }}>
            This is a Pro feature
          </h4>
          
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px', lineHeight: 1.5 }}>
            {benefit}
          </p>

          <div style={{ 
            width: '100%',
            backgroundColor: '#F5F5F7',
            padding: '12px',
            borderRadius: '14px',
            marginBottom: '20px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#1a1a1a'
          }}>
            Upgrade to Pro — from ₹374/month
          </div>

          <button 
            onClick={() => { onUpgrade(); onClose(); }}
            style={{
              width: '100%',
              backgroundColor: '#1a1a1a',
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '16px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#333'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
          >
            Upgrade to Pro
          </button>

          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#999',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              textDecoration: 'none'
            }}
          >
            Maybe later
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/**
 * LockedButton
 * Wrapper component to handle the locked button pattern.
 */
export const LockedButton = ({ children, isLocked, benefit, onUpgrade, style = {} }) => {
  const [showPopover, setShowPopover] = useState(false);
  const buttonRef = useRef(null);

  if (!isLocked) return React.cloneElement(children, { style: { ...children.props.style, ...style } });

  return (
    <>
      {React.cloneElement(children, {
        ref: buttonRef,
        style: {
          ...children.props.style,
          ...style,
          position: 'relative'
        },
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowPopover(true);
        },
        children: (
          <>
            <Lock size={14} style={{ marginRight: '8px', color: '#C6A96B' }} />
            {children.props.children}
          </>
        )
      })}
      <LockedPopover 
        isOpen={showPopover} 
        onClose={() => setShowPopover(false)} 
        benefit={benefit} 
        onUpgrade={onUpgrade}
        anchorRef={buttonRef}
      />
    </>
  );
};

/**
 * BlurredCard
 * Logic for items beyond the plan limit.
 */
export const BlurredCard = ({ index, limit = 3, children, onUpgrade }) => {
  const isLocked = index >= limit;

  if (!isLocked) return children;

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '24px' }}>
      <div style={{ filter: 'blur(8px)', opacity: 0.4, pointerEvents: 'none', transition: 'filter 0.3s' }}>
        {children}
      </div>
      
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 5,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '12px 20px',
          borderRadius: '16px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          width: 'max-content',
          border: '1px solid rgba(198, 169, 107, 0.3)',
          animation: 'slideUp 0.5s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#C6A96B" />
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1a1a1a' }}>
              5 more ideas unlocked with Pro
            </span>
          </div>
          <button 
            onClick={onUpgrade}
            style={{
              backgroundColor: '#C6A96B',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '10px',
              fontWeight: '900',
              fontSize: '11px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(198, 169, 107, 0.2)'
            }}
          >
            Upgrade
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
