import React from 'react';
import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PricingCards } from '../components/PricingCards';
import { useAuth } from '../context/AuthContext';

const PricingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAction = (data) => {
    if (data.plan === 'Pro Studio') {
      const monthlyUrl = 'https://kreavia.lemonsqueezy.com/checkout/buy/16880859-ae94-40bb-abdd-f9277d74a277';
      const yearlyUrl = 'https://kreavia.lemonsqueezy.com/checkout/buy/1341cf75-0a4a-4a7e-952a-89dbf6625cae';
      
      const baseUrl = data.isYearly ? yearlyUrl : monthlyUrl;
      const checkoutUrl = new URL(baseUrl);
      
      if (user) {
        checkoutUrl.searchParams.set('checkout[email]', user.email);
        checkoutUrl.searchParams.set('checkout[custom][user_id]', user.id);
        window.open(checkoutUrl.toString(), '_blank');
      } else {
        navigate('/signup');
      }
    } else if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="min-h-screen bg-main text-primary pt-32 pb-24 selection:bg-accent/20 font-ui">
      
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-bold uppercase tracking-widest mb-6">
            <Zap size={16} /> Unlock Your Brand
          </div>
          <h1 className="text-5xl md:text-6xl font-headline font-bold mb-6 tracking-tight text-primary">
            Simple, transparent pricing.
          </h1>
          <p className="text-xl text-muted font-medium">
            Start for free and upgrade when you're ready to scale your brand identity to the next level.
          </p>
        </motion.div>

        {/* Dynamic Pricing Cards Component */}
        <PricingCards onAction={handleAction} />

        {/* Benefits Row */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row gap-6 md:gap-12 justify-center py-8 border-y border-light w-full max-w-4xl mb-12 mt-16"
        >
           {[
             'No credit card required for free plan',
             'Cancel anytime',
             'Instant access after payment'
           ].map((item, idx) => (
             <div key={idx} className="flex items-center gap-2 text-primary/80 font-bold text-sm">
                <Check size={16} className="text-accent" />
                {item}
             </div>
           ))}
        </motion.div>

        {/* Footer Disclaimer */}
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-muted font-medium text-xs max-w-lg"
        >
          Prices shown in your local currency based on your location. All plans include 7 day free trial on Pro.
        </motion.p>
        
      </div>
    </div>
  );
};

export default PricingPage;
