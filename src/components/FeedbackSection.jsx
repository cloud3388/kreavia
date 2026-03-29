import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FeedbackSection = ({ id }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.target);
    formData.append('rating', rating);

    try {
      const response = await fetch("https://formspree.io/f/mwvwlqyr", {
        method: "POST",
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        alert("Oops! There was a problem submitting your feedback. Please try again.");
      }
    } catch (error) {
      alert("Oops! There was a problem submitting your feedback. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id={id} className="w-full py-24 overflow-hidden relative" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="container max-w-2xl mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <span className="text-xs font-black uppercase tracking-[0.25em] mb-4 block" style={{ color: '#0F1726' }}>
            SHARE YOUR THOUGHTS
          </span>
          <h2 className="text-4xl md:text-5xl font-headline font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#0F1726' }}>
            How was your Kreavia experience?
          </h2>
          <p className="font-body text-lg" style={{ color: 'rgba(15, 23, 38, 0.6)' }}>
            Your feedback helps us build better brand kits.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 md:p-12 rounded-[2rem] shadow-2xl relative overflow-hidden border"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                borderColor: 'rgba(15, 23, 38, 0.05)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)'
              }}
            >
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2 text-left">
                    <label className="text-xs font-bold uppercase tracking-wider ml-1" style={{ color: '#0F1726' }}>Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      placeholder="Your name" 
                      required 
                      className="w-full px-5 py-4 rounded-xl focus:outline-none transition-all border"
                      style={{ 
                        backgroundColor: '#FFFFFF', 
                        borderColor: 'rgba(15, 23, 38, 0.1)',
                        color: '#0F1726' 
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#FDCB6E'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(15, 23, 38, 0.1)'}
                    />
                  </div>
                  <div className="flex flex-col gap-2 text-left">
                    <label className="text-xs font-bold uppercase tracking-wider ml-1" style={{ color: '#0F1726' }}>Email</label>
                    <input 
                      type="email" 
                      name="email" 
                      placeholder="your@email.com" 
                      required 
                      className="w-full px-5 py-4 rounded-xl focus:outline-none transition-all border"
                      style={{ 
                        backgroundColor: '#FFFFFF', 
                        borderColor: 'rgba(15, 23, 38, 0.1)',
                        color: '#0F1726' 
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#FDCB6E'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(15, 23, 38, 0.1)'}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 items-center py-4 border-y" style={{ borderColor: 'rgba(15, 23, 38, 0.05)' }}>
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#0F1726' }}>Your Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        className="transition-transform hover:scale-110 active:scale-90 p-1"
                      >
                        <Star 
                          size={32} 
                          fill={(hover || rating) >= star ? "#FDCB6E" : "transparent"} 
                          style={{ color: (hover || rating) >= star ? "#FDCB6E" : 'rgba(15, 23, 38, 0.1)' }}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <span className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: '#C6A96B' }}>
                      {rating} / 5 STARS
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2 text-left">
                  <label className="text-xs font-bold uppercase tracking-wider ml-1" style={{ color: '#0F1726' }}>What did you love about Kreavia?</label>
                  <textarea 
                    name="loved" 
                    rows="3" 
                    placeholder="Tell us what worked for you..." 
                    className="w-full px-5 py-4 rounded-xl focus:outline-none transition-all border resize-none"
                    style={{ 
                      backgroundColor: '#FFFFFF', 
                      borderColor: 'rgba(15, 23, 38, 0.1)',
                      color: '#0F1726' 
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#FDCB6E'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(15, 23, 38, 0.1)'}
                  ></textarea>
                </div>

                <div className="flex flex-col gap-2 text-left">
                  <label className="text-xs font-bold uppercase tracking-wider ml-1" style={{ color: '#0F1726' }}>What can we improve?</label>
                  <textarea 
                    name="improve" 
                    rows="3" 
                    placeholder="How can we make it better?" 
                    className="w-full px-5 py-4 rounded-xl focus:outline-none transition-all border resize-none"
                    style={{ 
                      backgroundColor: '#FFFFFF', 
                      borderColor: 'rgba(15, 23, 38, 0.1)',
                      color: '#0F1726' 
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#FDCB6E'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(15, 23, 38, 0.1)'}
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading || rating === 0}
                  className="w-full py-5 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-glow flex justify-center items-center gap-3 border"
                  style={{ 
                    backgroundColor: (isLoading || rating === 0) ? 'rgba(15, 23, 38, 0.05)' : '#FDCB6E',
                    color: (isLoading || rating === 0) ? 'rgba(15, 23, 38, 0.4)' : '#0F1726',
                    cursor: (isLoading || rating === 0) ? 'not-allowed' : 'pointer',
                    borderColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && rating !== 0) {
                      e.target.style.filter = 'brightness(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading && rating !== 0) {
                      e.target.style.filter = 'brightness(1)';
                    }
                  }}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(15, 23, 38, 0.2)', borderTopColor: '#0F1726' }}></div>
                  ) : "Send Feedback"}
                </button>
                {rating === 0 && <span className="text-[10px] italic" style={{ color: 'rgba(15, 23, 38, 0.4)' }}>Please select a rating to enable submit button</span>}
              </form>
            </motion.div>
          ) : (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-16 rounded-[2rem] shadow-2xl text-center border"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                borderColor: 'rgba(15, 23, 38, 0.05)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)'
              }}
            >
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 border" style={{ backgroundColor: 'rgba(252, 203, 110, 0.1)', borderColor: 'rgba(252, 203, 110, 0.2)' }}>
                <Star size={40} fill="#FDCB6E" style={{ color: '#FDCB6E' }} />
              </div>
              <h3 className="text-3xl font-headline font-bold mb-4" style={{ color: '#0F1726' }}>You're Amazing!</h3>
              <p className="text-lg mb-8" style={{ color: 'rgba(15, 23, 38, 0.7)' }}>
                Thanks for your feedback! We read every response. 🙌
              </p>
              <button 
                onClick={() => setIsSubmitted(false)}
                className="font-bold text-sm uppercase tracking-widest hover:underline"
                style={{ color: '#C6A96B' }}
              >
                Send more feedback
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: 'rgba(252, 203, 110, 0.05)' }}></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/2" style={{ backgroundColor: 'rgba(15, 23, 38, 0.03)' }}></div>
    </section>
  );
};

export default FeedbackSection;
