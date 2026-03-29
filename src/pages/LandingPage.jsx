import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PricingCards } from '../components/PricingCards';
import { Sparkles, Palette, Type, Layout, Zap, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import FeedbackSection from '../components/FeedbackSection';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handlePricingAction = (data) => {
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
        navigate('/login', { state: { context: 'upgrade' } });
      }
    } else if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login', { state: { context: 'get_started' } });
    }
  };

  return (
    <div className="animate-fade-in overflow-hidden">
      {/* Hero Section - 12 Column Grid / 820px Height */}
      <section className="container min-h-[820px] flex items-center py-20 relative">
        {/* Background Gradients */}
        <div 
          className="absolute top-0 right-0 rounded-full blur-[120px] pointer-events-none -z-10 translate-x-1/3 -translate-y-1/4 bg-accent/10" 
          style={{ width: '800px', height: '800px' }}
        ></div>
        <div 
          className="absolute bottom-0 left-0 rounded-full blur-[100px] pointer-events-none -z-10 -translate-x-1/3 translate-y-1/4 bg-highlight/5" 
          style={{ width: '600px', height: '600px' }}
        ></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full items-center">
          
          {/* Left Side (6 Columns) */}
          <div className="lg:col-span-6 flex flex-col gap-8 z-10">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5 }}
               className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-light/50 text-sm text-accent bg-card/50 backdrop-blur-md w-max"
            >
              <Sparkles size={16} />
              <span>AI-Powered Brand Identity</span>
            </motion.div>
            
            <motion.h1 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5, delay: 0.1 }}
               className="text-5xl md:text-6xl lg:text-[5rem] leading-[1] font-headline text-primary font-bold"
            >
              Build Your Creator Brand in <span className="text-accent italic font-medium">30 Seconds</span>
            </motion.h1>
            
            <motion.p 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5, delay: 0.2 }}
               className="text-xl text-muted font-body leading-relaxed max-w-lg font-medium"
            >
              AI generates your full social media identity including perfectly paired typography, luxury color systems, and high-converting templates.
            </motion.p>
            
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5, delay: 0.3 }}
               className="flex flex-col sm:flex-row gap-4 mt-4"
            >
              <Link to="/onboarding" className="btn btn-primary h-14 px-10 text-lg w-full sm:w-auto shadow-glow flex justify-center items-center text-secondary font-black uppercase tracking-widest">
                Generate My Brand Kit
              </Link>
            </motion.div>

             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex items-center gap-6 mt-4 text-[10px] uppercase tracking-widest text-muted font-black"
             >
                <div className="flex items-center gap-2"><CheckCircle2 size={16} style={{ color: '#16a34a' }} /> No design skills needed</div>
                <div className="flex items-center gap-2"><CheckCircle2 size={16} style={{ color: '#16a34a' }} /> No credit card required</div>
             </motion.div>
          </div>
          
          {/* Right Side (6 Columns) - Animated Preview Cards */}
          <div className="lg:col-span-6 relative h-[600px] flex items-center justify-center pointer-events-none">
             
             {/* Main Post Card */}
             <motion.div 
                initial={{ opacity: 0, scale: 0.8, rotate: -5, x: 50 }}
                animate={{ opacity: 1, scale: 1, rotate: -2, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2, type: 'spring' }}
                className="absolute z-20 w-[320px] bg-secondary rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10"
                style={{ top: '10%' }}
             >
                <div className="aspect-[4/5] p-8 flex flex-col justify-center items-center text-center relative overflow-hidden" style={{ backgroundColor: '#F5F5F5' }}>
                   <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")" }}></div>
                   <div className="w-16 h-16 mb-6 flex items-center justify-center">
                     <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
                   </div>
                   <h3 className="font-headline text-4xl text-primary leading-tight">Elevate<br/>Your<br/>Aesthetic</h3>
                   <div className="h-1 w-12 bg-accent mt-8"></div>
                </div>
             </motion.div>

             {/* Palette Card */}
             <motion.div 
                initial={{ opacity: 0, x: -50, y: 50 }}
                animate={{ opacity: 1, x: -100, y: 80 }}
                transition={{ duration: 0.7, delay: 0.4, type: 'spring' }}
                className="absolute z-30 glass-card p-4 rounded-xl shadow-2xl flex flex-col gap-3 backdrop-blur-xl bg-card/80 border-light/50"
             >
                <div className="text-xs font-ui uppercase tracking-widest text-muted">Generated Palette</div>
                <div className="flex gap-2">
                   <div className="w-10 h-10 rounded-full border border-white/20 shadow-md" style={{ backgroundColor: '#0F0F0F' }}></div>
                   <div className="w-10 h-10 rounded-full shadow-md" style={{ backgroundColor: '#F5F5F5' }}></div>
                   <div className="w-10 h-10 rounded-full shadow-md" style={{ backgroundColor: '#C6A96B' }}></div>
                   <div className="w-10 h-10 rounded-full shadow-md" style={{ backgroundColor: '#6B7CFF' }}></div>
                </div>
             </motion.div>

              {/* Font Card */}
              <motion.div 
                 initial={{ opacity: 0, x: 50, y: 50 }}
                 animate={{ opacity: 1, x: 120, y: -40 }}
                 transition={{ duration: 0.7, delay: 0.6, type: 'spring' }}
                 className="absolute z-10 glass-card p-8 rounded-2xl shadow-2xl bg-surface border-none"
              >
                 <div className="text-[10px] font-black uppercase tracking-widest text-accent mb-3">Typography Pair</div>
                 <div className="font-headline text-4xl text-primary font-bold">Playfair</div>
                 <div className="font-body text-xl text-muted mt-1 italic font-medium">and Inter Sans</div>
              </motion.div>

          </div>

        </div>
      </section>

       {/* Features Section */}
       <section id="features" className="container py-40 flex flex-col items-center relative z-10">
         <div className="text-center mb-20">
           <h2 className="text-5xl md:text-6xl font-headline mb-6 text-primary font-bold">Everything you need.</h2>
           <p className="text-xl text-muted font-body font-medium">Professional creator tools, fully automated for your unique vibe.</p>
         </div>
        
         <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full">
           <motion.div whileHover={{ y: -10 }} className="glass-card p-12 flex flex-col gap-6 border-none shadow-sm transition-all bg-surface">
             <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-2 shadow-sm">
                <Palette size={32} />
             </div>
             <h3 className="text-3xl font-headline font-bold text-primary">Brand Identity</h3>
             <p className="text-muted leading-relaxed font-medium">Perfectly balanced color palettes and font pairings based on your niche and aesthetic vibe.</p>
           </motion.div>
           <motion.div whileHover={{ y: -10 }} className="glass-card p-12 flex flex-col gap-6 border-none shadow-sm transition-all bg-surface">
             <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-2 shadow-sm">
                <Layout size={32} />
             </div>
             <h3 className="text-3xl font-headline font-bold text-primary">Smart Templates</h3>
             <p className="text-muted leading-relaxed font-medium">Instagram grids, reels covers, and story templates auto-generated with your branding.</p>
           </motion.div>
           <motion.div whileHover={{ y: -10 }} className="glass-card p-12 flex flex-col gap-6 border-none shadow-sm transition-all bg-surface">
             <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-2 shadow-sm">
                <Type size={32} />
             </div>
             <h3 className="text-3xl font-headline font-bold text-primary">Content Engine</h3>
             <p className="text-muted leading-relaxed font-medium">AI-crafted viral hooks, luxury captions, and optimized hashtag strategies for growth.</p>
           </motion.div>
         </div>
      </section>
       {/* Pricing Section */}
       <section id="pricing" className="container py-40 flex flex-col items-center relative z-10">
         <div className="text-center mb-20">
           <h2 className="text-5xl md:text-6xl font-headline mb-6 text-primary font-bold">Simple, transparent pricing.</h2>
           <p className="text-xl text-muted font-body font-medium">Everything you need to build your brand identity.</p>
         </div>
         
         <PricingCards onAction={handlePricingAction} />
       </section>

       <FeedbackSection id="feedback" />
    </div>
  );
};

export default LandingPage;
