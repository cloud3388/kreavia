import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Sparkles, Wand2, Dumbbell, Plane, Shirt, 
  Gamepad2, Briefcase, Coffee, Check, Cpu, Utensils, Home, Users, Laptop
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buildBrandDNA } from '../ai/brandDNA';
import { generateBrandKit } from '../ai/pipeline';
import { generateHybridKit } from '../services/hybridAIService';

const getPipelineSteps = (formData) => [
  'You are a premium brand identity AI. The user has provided:',
  `- Brand name: ${formData?.brandName || '{brand_name}'}`,
  `- Instagram handle: ${formData?.instaHandle || '{insta_handle}'}`,
  `- Niche: ${formData?.niche || '{niche}'}`,
  `- Target audience: ${formData?.audience || '{audience}'}`,
  `- Brand style: ${formData?.vibe || '{style}'}`,
  `- Brand personality sliders: Professional ${Math.round(formData?.professionalLevel / 10) || '{p}'}/10, Minimal ${Math.round(formData?.minimalLevel / 10) || '{m}'}/10, Luxury ${Math.round(formData?.luxuryLevel / 10) || '{l}'}/10`,
  `- Brief: ${formData?.brief || '{brief}'}`,
];

const LoadingScreen = ({ currentStep, currentLabel, formData }) => {
  const steps = getPipelineSteps(formData);
  const displayStep = Math.min(currentStep + 1, steps.length);
  
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-12 w-full">
      <div className="relative">
         <div className="w-24 h-24 border-4 border-light border-t-accent rounded-full animate-spin"></div>
         <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-accent" size={32} />
      </div>
      
      <div className="flex flex-col items-center w-full max-w-lg">
         <h2 className="text-2xl font-headline text-center mb-1">Creating your brand identity...</h2>
         <p className="text-accent text-sm font-ui mb-2 animate-pulse">{currentLabel}</p>
         <div className="text-sm font-bold tracking-widest uppercase text-muted mb-8">
           Step {displayStep} of {steps.length}
         </div>
         
         <div className="flex flex-col gap-3 w-full">
            {steps.map((text, idx) => {
               const isComplete = currentStep > idx;
               const isCurrent = currentStep === idx;
               
               return (
                 <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: isComplete ? 1 : isCurrent ? 0.8 : 0.25, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-4 bg-card/50 p-4 rounded-lg border border-light/50"
                 >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isComplete ? 'bg-accent text-primary' : isCurrent ? 'border-2 border-accent' : 'border border-light'
                    }`}>
                       {isComplete && <Check size={14} />}
                       {isCurrent && <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />}
                    </div>
                    <span className={`font-ui text-sm ${isComplete ? 'text-primary font-medium' : isCurrent ? 'text-accent' : 'text-muted'}`}>{text}</span>
                 </motion.div>
               );
            })}
         </div>
      </div>
    </div>
  );
};


const OnboardingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [pipelineLabel, setPipelineLabel] = useState('Initializing...');
  
  const [formData, setFormData] = useState({
    brandInputType: 'name', // 'name' or 'handle'
    brandName: '',
    instaHandle: '',
    brief: '',
    niche: '',
    vibe: '',
    audience: '',
    professionalLevel: 50,
    minimalLevel: 50,
    luxuryLevel: 50
  });

  const handleNext = () => setStep(s => Math.min(s + 1, 5));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));
  
  const handleGenerate = async () => {
    const isPro = localStorage.getItem('kreavia_pro_user') === 'true';
    const count = parseInt(localStorage.getItem('kreavia_generation_count') || '0', 10);
    const limit = isPro ? 10 : 1;

    if (count >= limit) {
      alert(`Generation limit reached! You have used ${count}/${limit} generations for your current plan. Please upgrade to create more brands.`);
      return;
    }

    setLoading(true);
    setPipelineStep(0);
    try {
      localStorage.setItem('kreavia_generation_count', (count + 1).toString());
      
      const dna = buildBrandDNA(formData);
      // Store Brand DNA in sessionStorage so BrandKitPage can use it
      sessionStorage.setItem('brandDNA', JSON.stringify(dna));

      // Execute the full hybrid pipeline
      const result = await generateBrandKit(dna, (stepIndex, label) => {
        setPipelineStep(stepIndex);
        setPipelineLabel(label);
      });

      // Execute phase 2: Hybrid Content Generation (with its own steps 6 and 7)
      const hybridResult = await generateHybridKit(dna, (step, msg) => {
          setPipelineStep(5 + step); // Map hybrid step 1, 2 to pipeline step 6, 7
          setPipelineLabel(msg);
      });

      // Store the full generated kit for the dashboard
      sessionStorage.setItem('currentBrandKit', JSON.stringify({ ...result, hybridContent: hybridResult }));

      // Small pause so user sees "Done" before navigating
      setTimeout(() => navigate('/dashboard/brand-kit'), 800);
    } catch (err) {
      console.error('[Onboarding] Pipeline error:', err);
      // Fallback: navigate anyway so user isn't stuck
      setTimeout(() => navigate('/dashboard/brand-kit'), 1000);
    }
  };

  const updateForm = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const isNextDisabled = () => {
    if (step === 1) {
      const idEmpty = formData.brandInputType === 'name' ? !formData.brandName : !formData.instaHandle;
      if (idEmpty || !formData.brief) return true;
    }
    if (step === 2 && !formData.niche) return true;
    if (step === 3 && !formData.vibe) return true;
    if (step === 4 && !formData.audience) return true;
    return false;
  };

  const nicheOptions = [
    { id: 'fitness', label: 'Fitness', icon: <Dumbbell size={24} /> },
    { id: 'travel', label: 'Travel', icon: <Plane size={24} /> },
    { id: 'fashion', label: 'Fashion', icon: <Shirt size={24} /> },
    { id: 'gaming', label: 'Gaming', icon: <Gamepad2 size={24} /> },
    { id: 'technology', label: 'Technology', icon: <Cpu size={24} /> },
    { id: 'food', label: 'Food & Drink', icon: <Utensils size={24} /> },
    { id: 'real_estate', label: 'Real Estate', icon: <Home size={24} /> },
    { id: 'business', label: 'Business', icon: <Briefcase size={24} /> },
    { id: 'lifestyle', label: 'Lifestyle', icon: <Coffee size={24} /> },
  ];

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-highlight/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <div className="w-full max-w-[720px] glass-card border-light/50 relative z-10 shadow-2xl flex flex-col overflow-hidden min-h-[600px]">
        
        {/* Progress Bar (Hidden during loading) */}
        {!loading && (
          <div className="w-full h-1 bg-card">
            <div 
              className="h-full bg-accent transition-all duration-500 ease-out" 
              style={{ width: `${(step / 5) * 100}%` }}
            ></div>
          </div>
        )}

        <div className="p-8 md:p-12 flex-1 flex flex-col">
          {loading ? (
            <LoadingScreen currentStep={pipelineStep} currentLabel={pipelineLabel} formData={formData} />
          ) : (
            <>
              {/* Header */}
              <div className="mb-10">
                <span className="text-secondary/60 text-xs font-bold uppercase tracking-widest mb-3 block font-ui">Step {step} of 5</span>
                <h2 className="text-3xl lg:text-4xl font-headline">
                  {step === 1 && "Tell us about your brand"}
                  {step === 2 && "What is your primary niche?"}
                  {step === 3 && "Choose your brand style"}
                  {step === 4 && "Who is your audience?"}
                  {step === 5 && "Define your personality"}
                </h2>
              </div>

              {/* Form Content Area */}
              <div className="flex-1 relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    
                    {step === 1 && (
                      <div className="flex flex-col gap-8">
                        <div>
                          <p className="text-muted text-lg mb-4">How do you uniquely identify your brand?</p>
                          <div className="flex bg-card border border-light/50 rounded-xl p-1 mb-6">
                            <button
                              className={`flex-1 py-2 text-sm font-ui font-medium rounded-lg transition-colors ${formData.brandInputType === 'name' ? 'bg-accent/10 text-accent' : 'text-muted hover:text-primary'}`}
                              onClick={() => updateForm('brandInputType', 'name')}
                            >
                              Brand Name
                            </button>
                            <button
                              className={`flex-1 py-2 text-sm font-ui font-medium rounded-lg transition-colors ${formData.brandInputType === 'handle' ? 'bg-accent/10 text-accent' : 'text-muted hover:text-primary'}`}
                              onClick={() => updateForm('brandInputType', 'handle')}
                            >
                              Instagram Handle
                            </button>
                          </div>
                          
                          {formData.brandInputType === 'name' ? (
                            <input
                              type="text"
                              placeholder="E.g. Aura Skincare"
                              className="w-full bg-card border border-light/80 rounded-xl px-5 py-4 text-primary font-ui outline-none focus:border-accent transition-all"
                              value={formData.brandName}
                              onChange={(e) => updateForm('brandName', e.target.value)}
                            />
                          ) : (
                            <input
                              type="text"
                              placeholder="@username"
                              className="w-full bg-card border border-light/80 rounded-xl px-5 py-4 text-primary font-ui outline-none focus:border-accent transition-all"
                              value={formData.instaHandle}
                              onChange={(e) => updateForm('instaHandle', e.target.value)}
                            />
                          )}
                        </div>

                        <div>
                          <p className="text-muted text-lg mb-4">Briefly describe what your brand does.</p>
                          <textarea
                            placeholder="We create minimalist, organic skincare products for affluent women who value self-care routines..."
                            className="w-full h-32 bg-card border border-light/80 rounded-xl px-5 py-4 text-primary font-ui outline-none focus:border-accent transition-all resize-none"
                            value={formData.brief}
                            onChange={(e) => updateForm('brief', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {nicheOptions.map(option => (
                          <motion.button 
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            key={option.id}
                            onClick={() => updateForm('niche', option.id)}
                            className={`flex flex-col items-center justify-center gap-4 h-[120px] rounded-xl border transition-all ${formData.niche === option.id ? 'border-accent bg-accent/10 text-accent shadow-glow' : 'border-light/50 bg-card hover:border-muted'}`}
                          >
                            <div className={formData.niche === option.id ? 'text-accent' : 'text-muted'}>{option.icon}</div>
                            <span className="font-ui font-medium">{option.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {step === 3 && (
                      <div className="flex flex-col gap-4">
                        {['Luxury', 'Minimal', 'Bold', 'Playful', 'Dark Aesthetic'].map(vibe => (
                          <button 
                            key={vibe}
                            onClick={() => updateForm('vibe', vibe.toLowerCase())}
                            className={`p-5 rounded-xl border flex items-center justify-between transition-all ${formData.vibe === vibe.toLowerCase() ? 'border-accent bg-accent/5' : 'border-light bg-card hover:border-muted'}`}
                          >
                            <span className={`font-ui text-lg ${formData.vibe === vibe.toLowerCase() ? 'text-accent font-medium' : 'text-primary'}`}>{vibe}</span>
                            
                            {/* Visual Feed Preview Placeholder Container */}
                            <div className="flex gap-2">
                               <div className={`w-12 h-16 rounded overflow-hidden opacity-80 border border-light/20 ${formData.vibe === vibe.toLowerCase() ? 'border-accent/50' : ''}`}>
                                  <img src={`https://placehold.co/100x150/111/444?text=${vibe[0]}`} alt="" className="w-full h-full object-cover mix-blend-screen" />
                               </div>
                               <div className={`w-12 h-16 rounded overflow-hidden opacity-80 border border-light/20 ${formData.vibe === vibe.toLowerCase() ? 'border-accent/50' : ''}`}>
                                  <img src={`https://placehold.co/100x150/111/555?text=${vibe[1]}`} alt="" className="w-full h-full object-cover mix-blend-screen" />
                               </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {step === 4 && (
                      <div className="flex flex-col gap-8">
                         <p className="text-muted text-lg">Select your primary target demographic to tailor the visual appeal.</p>
                         
                         <div className="flex flex-col gap-3">
                           {[
                             { value: 'Entrepreneurs',     label: 'Entrepreneurs & Founders',    emoji: '💼' },
                             { value: 'Women 18-30',       label: 'Women 18–30',                  emoji: '✨' },
                             { value: 'Gen Z',            label: 'Gen Z (13-24)',                emoji: '⚡' },
                             { value: 'Gamers',            label: 'Gamers & Streamers',           emoji: '🎮' },
                             { value: 'Corporate',         label: 'Corporate Professionals',       emoji: '🏢' },
                             { value: 'Small Business',    label: 'Small Business Owners',         emoji: '🏪' },
                             { value: 'Freelancers',       label: 'Creative Freelancers',          emoji: '🎨' },
                             { value: 'Tech Enthusiasts',  label: 'Tech Enthusiasts',              emoji: '💻' },
                             { value: 'Fitness beginners', label: 'Fitness Beginners',            emoji: '💪' },
                             { value: 'Luxury lifestyle',  label: 'Luxury Lifestyle Enthusiasts', emoji: '🥂' },
                           ].map(opt => (
                             <button
                               key={opt.value}
                               type="button"
                               onClick={() => updateForm('audience', opt.value)}
                               className={`flex items-center gap-4 w-full px-5 py-4 rounded-xl border text-left transition-all font-ui ${
                                 formData.audience === opt.value
                                   ? 'border-accent bg-accent/10 text-accent'
                                   : 'border-light bg-card text-primary hover:border-muted hover:bg-black/5'
                               }`}
                             >
                               <span className="text-2xl">{opt.emoji}</span>
                               <span className="text-base font-medium">{opt.label}</span>
                               {formData.audience === opt.value && (
                                 <Check size={16} className="ml-auto text-accent shrink-0" />
                               )}
                             </button>
                           ))}
                         </div>
                      </div>
                    )}

                    {step === 5 && (
                      <div className="flex flex-col gap-10">
                         <div className="flex flex-col gap-4">
                           <div className="flex justify-between text-base font-ui">
                             <span className="text-muted">Professional</span>
                             <span className="text-secondary font-medium">Fun</span>
                           </div>
                           <input type="range" className="w-full accent-accent bg-light h-2 rounded-lg appearance-none cursor-pointer" 
                             min="0" max="100" value={formData.professionalLevel} onChange={(e) => updateForm('professionalLevel', e.target.value)} />
                         </div>
                         
                         <div className="flex flex-col gap-4">
                           <div className="flex justify-between text-base font-ui">
                             <span className="text-muted">Minimal</span>
                             <span className="text-secondary font-medium">Bold</span>
                           </div>
                           <input type="range" className="w-full accent-accent bg-light h-2 rounded-lg appearance-none cursor-pointer" 
                             min="0" max="100" value={formData.minimalLevel} onChange={(e) => updateForm('minimalLevel', e.target.value)} />
                         </div>

                         <div className="flex flex-col gap-4">
                           <div className="flex justify-between text-base font-ui">
                             <span className="text-muted">Luxury</span>
                             <span className="text-secondary font-medium">Casual</span>
                           </div>
                           <input type="range" className="w-full accent-accent bg-light h-2 rounded-lg appearance-none cursor-pointer" 
                             min="0" max="100" value={formData.luxuryLevel} onChange={(e) => updateForm('luxuryLevel', e.target.value)} />
                         </div>
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation Footer */}
              <div className="flex justify-between mt-12 pt-8 border-t border-light/50">
                <button 
                  onClick={handlePrev} 
                  className={`btn btn-ghost flex gap-2 h-12 px-6 ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                >
                  <ArrowLeft size={18} /> Back
                </button>
                
                {step < 5 ? (
                  <button 
                    onClick={handleNext} 
                    disabled={isNextDisabled()}
                    className={`btn btn-primary flex gap-2 h-12 px-8 ${isNextDisabled() ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-none bg-muted hover:bg-muted text-primary/50 border-none' : ''}`}
                  >
                    Continue <ArrowRight size={18} />
                  </button>
                ) : (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGenerate} 
                    className="btn btn-primary flex gap-2 h-12 px-8 shadow-glow"
                  >
                    <Wand2 size={18} /> Generate Brand
                  </motion.button>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default OnboardingPage;
