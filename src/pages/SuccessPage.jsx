import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, Trophy, ArrowRight, Crown } from 'lucide-react';

const SuccessPage = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Set user as PRO in localStorage for immediate feedback (until real session sync)
    localStorage.setItem('kreavia_pro_user', 'true');
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-main flex items-center justify-center p-6 relative overflow-hidden font-ui">
      
      {/* Background Celebration Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              top: '-10%', 
              left: `${Math.random() * 100}%`, 
              opacity: 1,
              rotate: 0,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              top: '110%', 
              rotate: 360,
              opacity: 0
            }}
            transition={{ 
              duration: Math.random() * 2 + 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "linear"
            }}
            style={{
              position: 'absolute',
              width: '10px',
              height: '10px',
              backgroundColor: ['#C6A96B', '#1a1a1a', '#FBFBFD', '#FFD700'][Math.floor(Math.random() * 4)],
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              zIndex: 0
            }}
          />
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-lg w-full bg-white rounded-[2.5rem] p-12 text-center shadow-2xl border border-light relative z-10"
      >
        <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-8 shadow-glow-accent">
          <Crown size={40} className="text-white" />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-4xl font-headline font-bold text-primary mb-4">
            Welcome to Pro Studio
          </h1>
          <p className="text-muted text-lg mb-10 leading-relaxed">
            Your account has been upgraded. All Pro features—including unlimited exports and AI generations—are now unlocked.
          </p>
        </motion.div>

        <div className="space-y-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary w-full py-4 text-lg font-bold flex items-center justify-center gap-3 shadow-xl"
          >
            Go to Dashboard <ArrowRight size={20} />
          </button>
          
          <p className="text-xs text-muted font-medium">
            Redirecting in <span className="text-accent font-bold">{countdown}s</span>...
          </p>
        </div>

        {/* Pro Badge List */}
        <div className="mt-12 pt-8 border-t border-light grid grid-cols-2 gap-4">
           {[
             { icon: <Sparkles size={14} />, label: 'Unlimited AI' },
             { icon: <Check size={14} />, label: 'No Watermarks' },
           ].map((item, i) => (
             <div key={i} className="flex items-center gap-2 justify-center py-2 px-4 rounded-full bg-surface border border-light text-[11px] font-bold text-primary">
               <span className="text-accent">{item.icon}</span>
               {item.label}
             </div>
           ))}
        </div>
      </motion.div>
    </div>
  );
};

export default SuccessPage;
