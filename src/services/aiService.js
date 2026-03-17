/**
 * aiService.js
 * AI generation layer — mock responses for local dev.
 * In production, replace each function with a backend API call
 * (e.g. POST /api/generate/brand-identity) that:
 *   1. Deducts credits via userService.deductCredits()
 *   2. Calls OpenAI / Replicate / SDXL
 *   3. Persists result in ai_generations + ai_usage tables
 *   4. Returns result_data to the frontend
 */
import { supabase, isMockMode } from '../lib/supabase';
import { generateImage } from './sdxlService';

// ──────────────────────────────────────────
// Internal helper — persist generation record
// ──────────────────────────────────────────
const persistGeneration = async ({ userId, projectId, generationType, prompt, resultData, model, creditsUsed = 1 }) => {
  if (isMockMode || !supabase) return;
  try {
    await supabase.from('ai_generations').insert({
      user_id: userId,
      project_id: projectId,
      generation_type: generationType,
      prompt,
      result_data: resultData,
      model,
      credits_used: creditsUsed,
    });
  } catch (err) {
    console.warn('[AI Service] Persistence failed (non-critical):', err.message);
  }
};

// ──────────────────────────────────────────
// Brand Identity Generation
// ──────────────────────────────────────────
export const generateBrandIdentity = async (userInputs = {}, context = {}) => {
  const brandName = userInputs.brandName || 'Kreavia';
  const industry  = userInputs.industry || 'Tech';
  const style     = userInputs.style || 'Minimalist';

  console.log(`[AI Service] Generating brand identity for: ${brandName}`);

  // 1. Generate real AI logos
  const logoPrompts = [
    `Luxurious high-end minimalist vector logo for "${brandName}", ${industry}, ${style} style, white background, high contrast, clean lines`,
    `Minimalist abstract symbol for "${brandName}", ${industry}, ${style}, geometric, sophisticated, vector style`,
  ];

  try {
    const [logo1, logo2] = await Promise.all([
      generateImage(logoPrompts[0]),
      generateImage(logoPrompts[1]),
    ]);

    const result = {
      brandName,
      industry,
      colors: {
        primary:   '#3E2723', // Espresso
        secondary: '#FDF8F1', // Cream
        accent:    '#8D6E63', // Caramel
        highlight: '#D7CCC8', // Latte
      },
      typography: {
        headline: 'Playfair Display',
        body:     'Inter',
        ui:       'Satoshi',
      },
      logos: [
        { type: 'Primary Logo', url: logo1, style: 'vector' },
        { type: 'Minimal Symbol', url: logo2, style: 'symbol' },
      ],
      brandScore:     95,
      brandArchetype: 'The Visionary',
      brandVoice:     'Sophisticated, minimal, quietly confident',
    };

    await persistGeneration({
      ...context,
      generationType: 'brand_identity',
      prompt: JSON.stringify(userInputs),
      resultData: result,
      model: 'sdxl-turbo',
      creditsUsed: 1,
    });

    return result;
  } catch (err) {
    console.error('[AI Service] Generation failed:', err);
    throw err;
  }
};

// ──────────────────────────────────────────
// Content Ideas
// ──────────────────────────────────────────
export const generateContentIdeas = async (niche = 'lifestyle', context = {}) => {
  const ideas = [
    { title: `Things nobody tells you about starting in ${niche}`,        hook: 'Nobody talks about this...', contentType: 'reel' },
    { title: 'My highly requested routine (aesthetic version)',              hook: 'You asked, I answered ✨',   contentType: 'carousel' },
    { title: '3 mistakes keeping you from growing your brand',              hook: 'Stop doing this 🚫',         contentType: 'reel' },
    { title: 'Behind the scenes: the reality vs. the aesthetic',           hook: 'Real talk...',               contentType: 'story' },
    { title: 'Why you need to stop overcomplicating your strategy',        hook: 'Simplify this now →',        contentType: 'carousel' },
  ];

  await persistGeneration({
    ...context,
    generationType: 'content_ideas',
    prompt: `niche:${niche}`,
    resultData: { ideas },
    model: 'gpt-4o-mock',
    creditsUsed: 1,
  });

  return new Promise(resolve => setTimeout(() => resolve(ideas), 1000));
};

// ──────────────────────────────────────────
// Captions
// ──────────────────────────────────────────
export const generateCaptions = async (tone = 'luxury', context = {}) => {
  const captionsByTone = {
    luxury:       ['Less noise, more elegance.', 'Building an empire quietly. 🕊️', 'Elevating the everyday.', 'The art of doing less, better.'],
    motivational: ['Your vision will become your reality.', 'Every step forward counts.', 'Small habits, massive results.', 'Be obsessed or be average.'],
    fun:          ['Living my best chaotic aesthetic life 🎀', 'Not me treating myself again 😅', 'Mood: main character energy ✨', 'Accidentally became the vibe 💅'],
    educational:  ["Here's what I wish I knew earlier 👇", 'The strategy that changed everything:', 'Save this for when you need it.', 'Thread: How to build your brand from scratch.'],
    minimal:      ['Less.', 'Quiet luxury.', 'Just be.', 'Less, but better.'],
  };

  const captions = captionsByTone[tone] || captionsByTone.luxury;

  await persistGeneration({
    ...context,
    generationType: 'caption',
    prompt: `tone:${tone}`,
    resultData: { captions, tone },
    model: 'gpt-4o-mock',
    creditsUsed: 1,
  });

  return new Promise(resolve => setTimeout(() => resolve(captions), 1000));
};

// ──────────────────────────────────────────
// Hashtags
// ──────────────────────────────────────────
export const generateHashtags = async (niche = 'lifestyle', context = {}) => {
  const hashtags = [
    { tag: '#luxurylifestyle',  category: 'broad',    reach_est: 1200000 },
    { tag: '#creatorjourney',   category: 'niche',    reach_est: 450000  },
    { tag: '#mindsetshift',     category: 'trending', reach_est: 890000  },
    { tag: '#aestheticfeed',    category: 'niche',    reach_est: 670000  },
    { tag: '#brandidentity',    category: 'niche',    reach_est: 320000  },
    { tag: `#${niche}creator`,  category: 'niche',    reach_est: 150000  },
  ];

  await persistGeneration({
    ...context,
    generationType: 'hashtags',
    prompt: `niche:${niche}`,
    resultData: { hashtags },
    model: 'gpt-4o-mock',
    creditsUsed: 1,
  });

  return new Promise(resolve => setTimeout(() => resolve(hashtags), 500));
};

// ──────────────────────────────────────────
// Bio Suggestions
// ──────────────────────────────────────────
export const generateBio = async (niche, tone, context = {}) => {
  const bios = [
    `✦ ${niche} creator | Helping you elevate your aesthetic`,
    `Curator of luxury simplicity. ${niche} | Brand building | Creator economy.`,
    `Building in public. ${niche} meets minimal luxury. 🕊️`,
  ];

  await persistGeneration({
    ...context,
    generationType: 'bio',
    prompt: `niche:${niche},tone:${tone}`,
    resultData: { bios },
    model: 'gpt-4o-mock',
    creditsUsed: 1,
  });

  return new Promise(resolve => setTimeout(() => resolve(bios), 800));
};
