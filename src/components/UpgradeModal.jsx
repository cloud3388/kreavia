import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, Zap, Check, Sparkles, Star, CreditCard, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    description: 'Get started with the basics',
    features: ['3 AI brand generations', '5 templates', 'Basic analytics', 'Limited content ideas'],
    cta: 'Current Plan',
    disabled: true,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    description: 'Everything you need to grow',
    badge: 'Most Popular',
    features: [
      'Unlimited AI generations',
      '200+ premium templates',
      'Full analytics suite',
      'Unlimited content ideas',
      'Custom brand guidelines PDF',
      'Priority AI support',
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
  {
    name: 'Agency',
    price: '$99',
    period: '/mo',
    description: 'For teams and brands',
    features: [
      'Everything in Pro',
      'Up to 10 brand profiles',
      'Team collaboration',
      'White-label exports',
      'Dedicated account manager',
      'API access',
    ],
    cta: 'Contact Sales',
  },
];

const CheckoutForm = ({ plan, onBack, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ card: '', expiry: '', cvc: '', name: '' });

  const formatCard = (val) => val.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().substring(0, 19);
  const formatExpiry = (val) => val.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1/$2').substring(0, 5);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onSuccess(); }, 2200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="flex flex-col gap-6"
    >
      <button onClick={onBack} className="flex items-center gap-2 text-muted hover:text-white text-sm font-ui transition-colors w-max">
        <ArrowLeft size={16} /> Back to plans
      </button>

      {/* Order Summary */}
      <div className="bg-accent/5 border border-accent/20 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div className="text-xs font-ui uppercase tracking-widest text-accent font-bold mb-1">{plan.name} Plan</div>
          <div className="text-sm text-muted">Billed monthly · Cancel anytime</div>
        </div>
        <div className="text-3xl font-headline text-white">{plan.price}<span className="text-base text-muted font-ui">/mo</span></div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-ui uppercase tracking-widest text-secondary/60 font-bold block mb-2">Cardholder Name</label>
          <input
            required
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Jane Doe"
            className="w-full bg-main border border-light/50 rounded-xl px-4 py-3 text-sm font-ui text-white placeholder:text-muted/50 outline-none focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-ui uppercase tracking-widest text-secondary/60 font-bold block mb-2">Card Number</label>
          <div className="relative">
            <input
              required
              value={form.card}
              onChange={e => setForm(p => ({ ...p, card: formatCard(e.target.value) }))}
              placeholder="1234 5678 9012 3456"
              className="w-full bg-main border border-light/50 rounded-xl px-4 py-3 pr-12 text-sm font-ui text-white placeholder:text-muted/50 outline-none focus:border-accent transition-colors"
            />
            <CreditCard size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-ui uppercase tracking-widest text-secondary/60 font-bold block mb-2">Expiry</label>
            <input
              required
              value={form.expiry}
              onChange={e => setForm(p => ({ ...p, expiry: formatExpiry(e.target.value) }))}
              placeholder="MM/YY"
              className="w-full bg-main border border-light/50 rounded-xl px-4 py-3 text-sm font-ui text-white placeholder:text-muted/50 outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-ui uppercase tracking-widest text-secondary/60 font-bold block mb-2">CVC</label>
            <input
              required
              value={form.cvc}
              onChange={e => setForm(p => ({ ...p, cvc: e.target.value.replace(/\D/g, '').substring(0, 3) }))}
              placeholder="123"
              className="w-full bg-main border border-light/50 rounded-xl px-4 py-3 text-sm font-ui text-white placeholder:text-muted/50 outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary h-13 py-4 w-full flex items-center justify-center gap-2 font-bold shadow-glow mt-2 disabled:opacity-70"
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> Processing...</>
          ) : (
            <><Lock size={14} /> Pay {plan.price}/month</>
          )}
        </button>

        <p className="text-center text-xs text-muted font-ui">
          <Lock size={10} className="inline mr-1" />
          Secured by 256-bit SSL encryption. Your data is safe.
        </p>
      </form>
    </motion.div>
  );
};

const SuccessScreen = ({ plan, onClose }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center gap-6 py-12 px-8 text-center"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', delay: 0.1, stiffness: 200 }}
      className="w-24 h-24 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center shadow-glow"
    >
      <CheckCircle2 size={48} className="text-accent" />
    </motion.div>
    <div>
      <h3 className="text-3xl font-headline text-white mb-3">Welcome to {plan.name}! 🎉</h3>
      <p className="text-muted font-ui">Your plan has been upgraded. All {plan.name} features are now unlocked.</p>
    </div>
    <div className="flex flex-col gap-3 w-full max-w-xs">
      {plan.features.slice(0, 3).map(f => (
        <div key={f} className="flex items-center gap-3 bg-accent/5 rounded-lg px-4 py-2.5 border border-accent/10">
          <Check size={14} className="text-accent shrink-0" />
          <span className="text-sm font-ui text-secondary">{f}</span>
        </div>
      ))}
    </div>
    <button onClick={onClose} className="btn btn-primary px-10 h-12 font-bold shadow-glow">
      Start Creating →
    </button>
  </motion.div>
);

const UpgradeModal = ({ isOpen, onClose }) => {
  const [screen, setScreen] = useState('plans'); // 'plans' | 'checkout' | 'success'
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleClose = () => {
    onClose();
    setTimeout(() => { setScreen('plans'); setSelectedPlan(null); }, 400);
  };

  const handlePlanCta = (plan) => {
    if (plan.disabled) return;
    if (plan.name === 'Agency') {
      window.open('mailto:sales@brandkitai.com?subject=Agency Plan Inquiry', '_blank');
      return;
    }
    setSelectedPlan(plan);
    setScreen('checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
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
            <div className={`w-full bg-card border border-light/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar ${screen === 'plans' ? 'max-w-4xl' : 'max-w-lg'}`}>
              
              {/* Header */}
              {screen !== 'success' && (
                <div className="flex items-center justify-between p-6 md:p-8 border-b border-light/50 bg-gradient-to-r from-card to-accent/5 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg"><Sparkles size={20} className="text-accent" /></div>
                    <div>
                      <h2 className="text-xl font-headline text-white">
                        {screen === 'plans' ? 'Upgrade Your Plan' : 'Checkout'}
                      </h2>
                      <p className="text-muted text-xs mt-0.5">
                        {screen === 'plans' ? 'Unlock the full power of AI branding.' : '14-day free trial · Cancel anytime'}
                      </p>
                    </div>
                  </div>
                  <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/10 text-muted hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
              )}

              {/* Content */}
              <AnimatePresence mode="wait">
                {screen === 'plans' && (
                  <motion.div key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-5"
                  >
                    {plans.map((plan) => (
                      <div
                        key={plan.name}
                        className={`relative flex flex-col rounded-2xl border p-6 gap-5 transition-all ${
                          plan.highlighted
                            ? 'border-accent bg-accent/5 shadow-[0_0_30px_rgba(198,169,107,0.15)]'
                            : 'border-light/50 bg-main/50'
                        }`}
                      >
                        {plan.badge && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-primary text-[11px] font-bold uppercase tracking-widest px-4 py-1 rounded-full flex items-center gap-1">
                            <Star size={10} /> {plan.badge}
                          </div>
                        )}
                        <div>
                          <div className={`text-xs font-ui font-bold uppercase tracking-widest mb-2 ${plan.highlighted ? 'text-accent' : 'text-muted'}`}>{plan.name}</div>
                          <div className="flex items-end gap-1">
                            <span className="font-headline text-4xl text-white">{plan.price}</span>
                            <span className="text-muted font-ui text-sm mb-1">{plan.period}</span>
                          </div>
                          <p className="text-muted text-sm mt-1">{plan.description}</p>
                        </div>
                        <div className="h-px bg-light/30" />
                        <ul className="flex flex-col gap-3 flex-1">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-2.5 text-sm font-ui">
                              <Check size={14} className={`mt-0.5 shrink-0 ${plan.highlighted ? 'text-accent' : 'text-muted'}`} />
                              <span className={plan.highlighted ? 'text-secondary' : 'text-secondary/70'}>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <button
                          disabled={plan.disabled}
                          onClick={() => handlePlanCta(plan)}
                          className={`mt-2 h-11 rounded-xl font-ui font-bold text-sm w-full flex items-center justify-center gap-2 transition-all ${
                            plan.disabled
                              ? 'bg-card border border-light/30 text-muted cursor-default'
                              : plan.highlighted
                              ? 'btn btn-primary shadow-glow hover:scale-[1.02]'
                              : 'btn btn-outline border-white/20 text-white hover:border-accent hover:text-accent'
                          }`}
                        >
                          {plan.highlighted && <Zap size={14} />}
                          {plan.cta}
                        </button>
                      </div>
                    ))}
                    <div className="md:col-span-3 text-center text-xs text-muted font-ui pt-2">
                      All plans include a 14-day free trial. No credit card required to start. Cancel anytime.
                    </div>
                  </motion.div>
                )}

                {screen === 'checkout' && selectedPlan && (
                  <div key="checkout" className="p-6 md:p-8">
                    <CheckoutForm
                      plan={selectedPlan}
                      onBack={() => setScreen('plans')}
                      onSuccess={() => setScreen('success')}
                    />
                  </div>
                )}

                {screen === 'success' && selectedPlan && (
                  <SuccessScreen key="success" plan={selectedPlan} onClose={handleClose} />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UpgradeModal;
