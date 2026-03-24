import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Crown, Check } from 'lucide-react';

export const pricingData = {
  IN: { currency: '₹', monthly: 499, yearlyOriginal: 5988, yearlyDiscounted: 4491, yearlyMonthlyEq: 374, savings: 1497 },
  EU: { currency: '€', monthly: 17, yearlyOriginal: 204, yearlyDiscounted: 153, yearlyMonthlyEq: 12.75, savings: 51 },
  DEFAULT: { currency: '$', monthly: 19, yearlyOriginal: 228, yearlyDiscounted: 171, yearlyMonthlyEq: 14.25, savings: 57 }
};

export const PricingCards = ({ onAction, buttonLabel = "Get Started", proButtonLabel = "Upgrade to Pro" }) => {
  const [isYearly, setIsYearly] = useState(false);
  const [tier, setTier] = useState('DEFAULT');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Location fetching removed to avoid CORS and rate-limit issues in dev/production.
    // Defaulting to the standard USD tier.
    setTier('DEFAULT');
    setLoading(false);
  }, []);

  const pricing = pricingData[tier];

  return (
    <div className="flex flex-col items-center w-full">
        {/* Toggle component */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center mb-16"
        >
          <div className="flex items-center bg-surface p-1.5 rounded-full border border-light shadow-sm relative z-10">
             <button
               onClick={() => setIsYearly(false)}
               className={`relative z-10 px-8 py-3 rounded-full font-bold transition-colors ${!isYearly ? 'text-white' : 'text-muted hover:text-primary'}`}
             >
               Monthly
               {!isYearly && <motion.div layoutId="pillActive" className="absolute inset-0 bg-primary rounded-full -z-10 shadow-md"></motion.div>}
             </button>
             <button
               onClick={() => setIsYearly(true)}
               className={`relative z-10 px-8 py-3 rounded-full font-bold transition-colors flex items-center gap-2 ${isYearly ? 'text-white' : 'text-muted hover:text-primary'}`}
             >
               Yearly
               {isYearly && <motion.div layoutId="pillActive" className="absolute inset-0 bg-primary rounded-full -z-10 shadow-md"></motion.div>}
             </button>
          </div>
          
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-accent/20 border border-accent/20 rounded-full text-accent text-[11px] font-black uppercase tracking-widest animate-pulse">
             25% OFF Early Access
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
          
          {/* Free Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-surface rounded-3xl p-10 border border-light flex flex-col relative overflow-hidden group hover:border-primary/20 transition-colors shadow-sm"
          >
             <h3 className="text-2xl font-headline font-bold text-primary mb-2">Free Forever</h3>
             <p className="text-muted text-sm font-medium mb-8">Perfect for exploring your brand aesthetic.</p>
             
             <div className="mb-8 flex items-end gap-1">
               <span className="text-5xl font-headline font-bold text-primary">{pricing.currency}0</span>
             </div>

             <button onClick={() => onAction({ plan: 'Free', price: 0, period: 'Forever' })} className="w-full py-4 rounded-xl border-2 border-primary/10 text-primary font-bold hover:bg-primary/5 transition-colors mb-10 group-hover:border-primary/30">
               {buttonLabel}
             </button>

             <div className="flex flex-col gap-4 flex-1">
                {[
                  '1 brand kit',
                  '3 template exports (watermarked)',
                  '3 AI generations per month',
                  'Basic content ideas'
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-4">
                     <CheckCircle2 size={20} className="text-primary/40 shrink-0 mt-0.5" />
                     <span className="text-primary font-medium">{feature}</span>
                  </div>
                ))}
             </div>
          </motion.div>

          {/* Pro Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-primary text-white rounded-3xl p-10 relative overflow-hidden flex flex-col shadow-2xl scale-100 md:scale-105 z-10"
          >
             <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 blur-[80px] rounded-full -mr-32 -mt-32"></div>
             
             <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-accent text-black px-6 py-1.5 rounded-b-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
               <Crown size={12} /> Most Popular
             </div>

             <h3 className="text-2xl font-headline font-bold text-white mb-2 mt-4">Pro Studio</h3>
             <p className="text-white/60 text-sm font-medium mb-6">Everything you need to dominate your niche.</p>
             
             <div className="mb-6 h-[80px]">
               <AnimatePresence mode="wait">
                 {!isYearly ? (
                   <motion.div 
                     key="monthly" 
                     initial={{ opacity: 0, y: 10 }} 
                     animate={{ opacity: 1, y: 0 }} 
                     exit={{ opacity: 0, y: -10 }}
                     className="flex flex-col"
                   >
                     <div className="flex items-end gap-1">
                       <span className="text-5xl font-headline font-bold text-white">{pricing.currency}{pricing.monthly}</span>
                       <span className="text-white/60 font-medium mb-1.5">/month</span>
                     </div>
                     <div className="text-accent text-sm font-bold mt-2 opacity-0">Placeholder</div>
                   </motion.div>
                 ) : (
                   <motion.div 
                     key="yearly" 
                     initial={{ opacity: 0, y: 10 }} 
                     animate={{ opacity: 1, y: 0 }} 
                     exit={{ opacity: 0, y: -10 }}
                     className="flex flex-col"
                   >
                     <div className="flex flex-col mb-1 relative leading-none">
                       <span className="text-white/40 text-lg font-bold line-through absolute -top-5">{pricing.currency}{pricing.yearlyOriginal}/year</span>
                       <div className="flex items-end gap-1 mt-1">
                         <span className="text-5xl font-headline font-bold text-white">{pricing.currency}{pricing.yearlyDiscounted}</span>
                         <span className="text-white/60 font-medium mb-1.5">/year</span>
                       </div>
                     </div>
                     <span className="text-accent text-sm font-bold mt-2">
                       just {pricing.currency}{pricing.yearlyMonthlyEq}/month - You save {pricing.currency}{pricing.savings} with early access discount
                     </span>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>

             <button 
               onClick={() => onAction({ 
                 plan: 'Pro Studio', 
                 price: isYearly ? `${pricing.currency}${pricing.yearlyDiscounted}` : `${pricing.currency}${pricing.monthly}`, 
                 period: isYearly ? '/year' : '/month',
                 isYearly: isYearly,
                 features: ['5 brand kits', 'Unlimited template exports', 'No watermarks', 'Unlimited AI generations', 'Full content ideas suite', 'Priority support']
               })} 
               className="w-full py-4 rounded-xl bg-white text-black font-bold hover:bg-highlight transition-colors mb-10 shadow-lg shadow-white/10 group"
             >
               {proButtonLabel}
             </button>

             <div className="flex flex-col gap-4 flex-1">
                {[
                  '5 brand kits',
                  'Unlimited template exports',
                  'No watermarks',
                  'Unlimited AI generations',
                  'Full content ideas suite',
                  'Brand voice rewriter',
                  'Shareable brand kit link',
                  'Version history',
                  'Priority support'
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-4">
                     <CheckCircle2 size={20} className="text-accent shrink-0 mt-0.5" />
                     <span className="text-white/90 font-medium">{feature}</span>
                  </div>
                ))}
             </div>
          </motion.div>
        </div>
    </div>
  );
};
