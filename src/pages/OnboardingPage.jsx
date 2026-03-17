import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, Wand2, Dumbbell, Plane, Shirt, Gamepad2, Briefcase, Coffee, Check } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { buildBrandDNA } from '../ai/brandDNA';
import { generateBrandKit } from '../ai/pipeline';

const PIPELINE_STEPS = [
  'Building brand profile...',
  'Generating color palette...',
  'Creating logo concepts...',
  'Selecting typography...',
  'Building templates...',
  'Writing content ideas...',
];

const LoadingScreen = ({ currentStep, currentLabel }) => {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-12 w-full">
      <div className="relative">
         <div className="w-24 h-24 border-4 border-light border-t-accent rounded-full animate-spin"></div>
         <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-accent" size={32} />
      </div>
      
      <div className="flex flex-col items-center w-full max-w-sm">
         <h2 className="text-2xl font-headline text-center mb-2">Creating your brand identity...</h2>
         <p className="text-accent text-sm font-ui mb-8 animate-pulse">{currentLabel}</p>
         
         <div className="flex flex-col gap-3 w-full">
            {PIPELINE_STEPS.map((text, idx) => {
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
                    <span className={`font-ui text-sm ${isComplete ? 'text-white font-medium' : isCurrent ? 'text-accent' : 'text-muted'}`}>{text}</span>
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
  const [pipelineLabel, setPipelineLabel] = useState(PIPELINE_STEPS[0]);
  
  const [formData, setFormData] = useState({
    niche: '',
    vibe: '',
    audience: '',
    professionalLevel: 50,
    minimalLevel: 50,
    luxuryLevel: 50
  });

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));
  
  const handleGenerate = async () => {
    setLoading(true);
    setPipelineStep(0);
    try {
      const dna = buildBrandDNA(formData);
      // Store Brand DNA in sessionStorage so BrandKitPage can use it
      sessionStorage.setItem('brandDNA', JSON.stringify(dna));

      const result = await generateBrandKit(dna, (stepIndex, label) => {
        setPipelineStep(stepIndex);
        setPipelineLabel(label);
      });

      // Store the full generated kit for the dashboard
      sessionStorage.setItem('currentBrandKit', JSON.stringify(result));

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
    if (step === 1 && !formData.niche) return true;
    if (step === 2 && !formData.vibe) return true;
    if (step === 3 && !formData.audience) return true;
    return false;
  };

  const nicheOptions = [
    { id: 'fitness', label: 'Fitness', icon: <Dumbbell size={24} /> },
    { id: 'travel', label: 'Travel', icon: <Plane size={24} /> },
    { id: 'fashion', label: 'Fashion', icon: <Shirt size={24} /> },
    { id: 'gaming', label: 'Gaming', icon: <Gamepad2 size={24} /> },
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
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        )}

        <div className="p-8 md:p-12 flex-1 flex flex-col">
          {loading ? (
            <LoadingScreen currentStep={pipelineStep} currentLabel={pipelineLabel} />
          ) : (
            <>
              {/* Header */}
              <div className="mb-10">
                <span className="text-secondary/60 text-xs font-bold uppercase tracking-widest mb-3 block font-ui">Step {step} of 4</span>
                <h2 className="text-3xl lg:text-4xl font-headline">
                  {step === 1 && "What is your primary niche?"}
                  {step === 2 && "Choose your brand style"}
                  {step === 3 && "Who is your audience?"}
                  {step === 4 && "Define your personality"}
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

                    {step === 2 && (
                      <div className="flex flex-col gap-4">
                        {['Luxury', 'Minimal', 'Bold', 'Playful', 'Dark Aesthetic'].map(vibe => (
                          <button 
                            key={vibe}
                            onClick={() => updateForm('vibe', vibe.toLowerCase())}
                            className={`p-5 rounded-xl border flex items-center justify-between transition-all ${formData.vibe === vibe.toLowerCase() ? 'border-accent bg-accent/5' : 'border-light bg-card hover:border-muted'}`}
                          >
                            <span className={`font-ui text-lg ${formData.vibe === vibe.toLowerCase() ? 'text-accent font-medium' : 'text-white'}`}>{vibe}</span>
                            
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

                    {step === 3 && (
                      <div className="flex flex-col gap-8">
                         <p className="text-muted text-lg">Select your primary target demographic to tailor the visual appeal.</p>
                         
                         <div className="flex flex-col gap-3">
                           {[
                             { value: 'Entrepreneurs',     label: 'Entrepreneurs & Founders',    emoji: '💼' },
                             { value: 'Women 18-30',       label: 'Women 18–30',                  emoji: '✨' },
                             { value: 'Gamers',            label: 'Gamers & Streamers',           emoji: '🎮' },
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
                                   : 'border-light bg-card text-white hover:border-muted hover:bg-white/5'
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

                    {step === 4 && (
                      <div className="flex flex-col gap-10">
                         <div className="flex flex-col gap-4">
                           <div className="flex justify-between text-base font-ui">
                             <span className="text-muted">Professional</span>
                             <span className="text-white font-medium">Fun</span>
                           </div>
                           <input type="range" className="w-full accent-accent bg-light h-2 rounded-lg appearance-none cursor-pointer" 
                             min="0" max="100" value={formData.professionalLevel} onChange={(e) => updateForm('professionalLevel', e.target.value)} />
                         </div>
                         
                         <div className="flex flex-col gap-4">
                           <div className="flex justify-between text-base font-ui">
                             <span className="text-muted">Minimal</span>
                             <span className="text-white font-medium">Bold</span>
                           </div>
                           <input type="range" className="w-full accent-accent bg-light h-2 rounded-lg appearance-none cursor-pointer" 
                             min="0" max="100" value={formData.minimalLevel} onChange={(e) => updateForm('minimalLevel', e.target.value)} />
                         </div>

                         <div className="flex flex-col gap-4">
                           <div className="flex justify-between text-base font-ui">
                             <span className="text-muted">Luxury</span>
                             <span className="text-white font-medium">Casual</span>
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
                
                {step < 4 ? (
                  <button 
                    onClick={handleNext} 
                    disabled={isNextDisabled()}
                    className={`btn btn-primary flex gap-2 h-12 px-8 ${isNextDisabled() ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-none bg-muted hover:bg-muted text-white/50 border-none' : ''}`}
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
