import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Check, Sparkles, Star, CreditCard, Lock, ArrowLeft, CheckCircle2, Crown } from 'lucide-react';
import { PricingCards } from './PricingCards';
import { useAuth } from '../context/AuthContext';

// Mock screens removed to prioritize Lemon Squeezy integration

const UpgradeModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const handlePlanCta = (data) => {
    if (data.plan === 'Pro Studio') {
      const monthlyUrl = 'https://kreavia.lemonsqueezy.com/checkout/buy/16880859-ae94-40bb-abdd-f9277d74a277';
      const yearlyUrl = 'https://kreavia.lemonsqueezy.com/checkout/buy/1341cf75-0a4a-4a7e-952a-89dbf6625cae';
      
      const baseUrl = data.isYearly ? yearlyUrl : monthlyUrl;
      const checkoutUrl = new URL(baseUrl);
      
      if (user) {
        checkoutUrl.searchParams.set('checkout[email]', user.email);
        checkoutUrl.searchParams.set('checkout[custom][user_id]', user.id);
      }
      
      window.open(checkoutUrl.toString(), '_blank');
      onClose(); // Close the modal as the user is going to a new tab
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className={`w-full bg-card border border-light/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar max-w-4xl`}>
              
              {/* Header */}
              <div className="flex items-center justify-between p-6 md:p-8 border-b border-light/50 bg-gradient-to-r from-card to-accent/5 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg"><Sparkles size={20} className="text-accent" /></div>
                  <div>
                    <h2 className="text-xl font-headline text-primary">Upgrade Your Plan</h2>
                    <p className="text-muted text-xs mt-0.5">Unlock the full power of AI branding.</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 text-muted hover:text-primary transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <AnimatePresence mode="wait">
                <motion.div key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-6 md:p-8 flex flex-col items-center"
                >
                  <div className="w-full transform scale-[0.85] origin-top">
                    <PricingCards 
                      buttonLabel="Current Plan" 
                      proButtonLabel="Upgrade to Pro"
                      onAction={handlePlanCta} 
                    />
                  </div>
                  <div className="text-center text-xs text-muted font-ui pt-2 -mt-4 mb-4">
                    All plans include a 14-day free trial. No credit card required to start. Cancel anytime.
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UpgradeModal;
