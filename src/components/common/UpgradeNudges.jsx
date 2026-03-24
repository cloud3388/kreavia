import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, Lock, Crown, ArrowRight, Info } from 'lucide-react';
import { getPlanStatus } from '../../utils/planPermissions';

/**
 * NUDGE 1 - Session Banner
 * Appears at the top of the page, dismissible.
 */
export const NudgeBanner = ({ id, message, benefit, onUpgrade, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show only if NOT dismissed in this session and user is FREE
    const isDismissed = sessionStorage.getItem(`nudge_dismissed_${id}`);
    const isFree = getPlanStatus().maxTemplateExports !== Infinity;
    
    if (!isDismissed && isFree) {
      setIsVisible(true);
    }
  }, [id]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem(`nudge_dismissed_${id}`, 'true');
    if (onDismiss) onDismiss();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          style={{ backgroundColor: 'rgba(198, 169, 107, 0.1)', borderBottom: '1px solid rgba(198, 169, 107, 0.2)', overflow: 'hidden' }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: '#C6A96B', padding: '6px', borderRadius: '8px', color: 'white' }}>
                <Crown size={14} />
              </div>
              <div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a' }}>{message}</span>
                <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>— {benefit}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                onClick={onUpgrade}
                style={{ backgroundColor: '#1a1a1a', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Upgrade <ArrowRight size={14} />
              </button>
              <button onClick={handleDismiss} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * NUDGE 2 - Float Toast
 * Appears briefly after an action (like export).
 */
export const NudgeToast = ({ isVisible, message, onUpgrade, onDismiss }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 10000 }}
        >
          <div style={{ backgroundColor: '#1a1a1a', color: 'white', padding: '12px 24px', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
             <div style={{ backgroundColor: 'rgba(198, 169, 107, 0.2)', padding: '8px', borderRadius: '10px', color: '#C6A96B' }}>
               <Info size={16} />
             </div>
             <span style={{ fontSize: '13px', fontWeight: '600' }}>{message}</span>
             <button 
               onClick={onUpgrade}
               style={{ backgroundColor: '#C6A96B', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
             >
                PRO
             </button>
             <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                <X size={16} />
             </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * NUDGE 3 - Inline Content Card
 */
export const NudgeInlineCard = ({ message, onUpgrade }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      style={{ 
        gridColumn: '1 / -1', 
        padding: '32px', 
        borderRadius: '24px', 
        backgroundColor: 'rgba(198, 169, 107, 0.05)', 
        border: '2px solid rgba(198, 169, 107, 0.3)', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        textAlign: 'center',
        margin: '16px 0'
      }}
    >
      <div style={{ backgroundColor: '#C6A96B', padding: '12px', borderRadius: '16px', color: 'white', marginBottom: '16px', boxShadow: '0 8px 16px rgba(198, 169, 107, 0.2)' }}>
        <Zap size={24} />
      </div>
      <h4 style={{ fontSize: '18px', fontWeight: '900', color: '#1a1a1a', marginBottom: '8px' }}>You are on a roll!</h4>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px', maxWidth: '400px' }}>{message}</p>
      <button 
        onClick={onUpgrade}
        style={{ padding: '12px 32px', backgroundColor: '#1a1a1a', color: 'white', borderRadius: '12px', fontWeight: '800', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        Unlock Pro Access <ArrowRight size={16} />
      </button>
    </motion.div>
  );
};
