/**
 * src/services/hybridAIService.js
 * Orchestrates the two-step AI flow: Text -> Image.
 */

const TEXT_PROXY_URL  = '/api/ai-text';
const IMAGE_PROXY_URL = '/api/ai-image';

// Direct URLs (via Vite proxy in vite.config.js)
const DIRECT_TEXT_URL  = '/groq-api/openai/v1/chat/completions';
const DIRECT_IMAGE_URL = '/nvidia-api/v1/genai/stabilityai/stable-diffusion-xl';

const groqKey = import.meta.env.VITE_GROQ_API_KEY;
const imageKey    = import.meta.env.VITE_NVIDIA_API_KEY;
const useProxy    = import.meta.env.VITE_USE_AI_PROXY === 'true';

const isMock = (!groqKey || groqKey.startsWith('gsk_')) === false && (!imageKey || imageKey.startsWith('nvapi-YOUR'));

/**
 * Generates brand content using the hybrid flow.
 */
export const generateHybridContent = async (dna, type = 'post', onProgress = () => {}) => {
  const cacheKey = `hybrid_${dna.niche}_${dna.style}_${type}`;
  
  // 1. Check Cache
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    console.log('[Hybrid Service] Returning cached result for:', cacheKey);
    return JSON.parse(cached);
  }

  if (isMock && !useProxy) {
    console.log('[Hybrid Service] MOCK MODE ACTIVE');
    onProgress(1, 'Generating brand narrative... (MOCK)');
    await new Promise(r => setTimeout(r, 1000));
    const textData = {
        caption: `Elevate your ${dna.niche} game with the perfect ${dna.style} vibe. ✨`,
        tagline: `${dna.niche.toUpperCase()} REIMAGINED.`,
        imagePrompt: `A stunning ${dna.style} visual for a ${dna.niche} brand, high resolution, professional lighting, cinematic composition.`,
    };
    
    onProgress(2, 'Visualizing brand assets... (MOCK)');
    await new Promise(r => setTimeout(r, 1500));
    const finalResult = { ...textData, imageUrl: `https://placehold.co/1024x1024/111/C6A96B?text=AI+Visual&font=playfair`, generatedAt: new Date().toISOString() };
    localStorage.setItem(cacheKey, JSON.stringify(finalResult));
    return finalResult;
  }

  try {
    // Phase 1: Text Generation
    onProgress(1, 'Generating brand narrative...');
    
    let textData;
    if (useProxy) {
      const res = await fetch(TEXT_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dna, type }),
      });
      if (!res.ok) throw new Error('Proxy text generation failed');
      textData = await res.json();
    } else {
      // Direct call via Vite proxy
      const prompt = `Generate a creative caption, tagline, and SDXL-compatible image prompt for a ${type} for a brand with this DNA: ${JSON.stringify(dna)}. Output JSON: {caption, tagline, imagePrompt}`;
      const res = await fetch(DIRECT_TEXT_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 1, top_p: 1, max_tokens: 1024,
        }),
      });
      if (!res.ok) throw new Error('Direct text generation failed');
      const data = await res.json();
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      textData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    }

    console.log('[Hybrid Service] Text generated:', textData);

    // Phase 2: Image Generation (with retries)
    onProgress(2, 'Visualizing brand assets...');
    let imageUrl = null;
    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries && !imageUrl) {
      try {
        attempts++;
        console.log(`[Hybrid Service] Image generation attempt ${attempts}...`);
        
        let imgRes;
        if (useProxy) {
          imgRes = await fetch(IMAGE_PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: textData.imagePrompt, style: dna.style }),
          });
        } else {
          // Direct call via Vite proxy
          imgRes = await fetch(DIRECT_IMAGE_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${imageKey}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              text_prompts: [{ text: textData.imagePrompt, weight: 1.0 }, { text: 'text, watermark, blurry', weight: -1.0 }],
              cfg_scale: 7, steps: 25, width: 1024, height: 1024,
            }),
          });
        }

        if (imgRes.ok) {
          const imgData = await imgRes.json();
          // Direct NVIDIA returns artifacts[0].base64, Proxy returns { imageUrl }
          imageUrl = useProxy ? imgData.imageUrl : `data:image/png;base64,${imgData?.artifacts?.[0]?.base64}`;
        } else {
          console.warn(`[Hybrid Service] Image attempt ${attempts} failed.`);
          if (attempts < maxRetries) await new Promise(r => setTimeout(r, 1000 * attempts));
        }
      } catch (err) {
        console.warn(`[Hybrid Service] Attempt ${attempts} error:`, err.message);
      }
    }

    if (!imageUrl) {
      // Fallback placeholder if all retries fail
      imageUrl = `https://placehold.co/1024x1024/111/444?text=${encodeURIComponent(textData.tagline || 'Brand Image')}`;
    }

    const finalResult = {
      ...textData,
      imageUrl,
      generatedAt: new Date().toISOString()
    };

    // Save to cache
    localStorage.setItem(cacheKey, JSON.stringify(finalResult));

    return finalResult;
  } catch (err) {
    console.error('[Hybrid Service] Flow failed:', err.message);
    throw err;
  }
};

/**
 * Generates a kit of 3 items in parallel using the hybrid flow.
 */
export const generateHybridKit = async (dna, onProgress = () => {}) => {
  const types = ['primary_post', 'secondary_story', 'social_reel'];
  
  // Update progress for the whole kit
  onProgress(0, 'Initializing hybrid generation...');
  
  const results = await Promise.all(types.map((type, idx) => {
    return generateHybridContent(dna, type, (step, msg) => {
      if (idx === 0) onProgress(step, msg); // Only report progress for the first one to avoid UI flicker
    });
  }));

  return results;
};
