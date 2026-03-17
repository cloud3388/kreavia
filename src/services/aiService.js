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

// ──────────────────────────────────────────
// Internal helper — persist generation record
// ──────────────────────────────────────────
const persistGeneration = async ({ userId, projectId, generationType, prompt, resultData, model, creditsUsed = 1 }) => {
  if (isMockMode || !supabase) return;
  await supabase.from('ai_generations').insert({
    user_id: userId,
    project_id: projectId,
    generation_type: generationType,
    prompt,
    result_data: resultData,
    model,
    credits_used: creditsUsed,
  });
  await supabase.from('ai_usage').insert({
    user_id: userId,
    generation_type: generationType,
    credits_used: creditsUsed,
  });
};

// ──────────────────────────────────────────
// Brand Identity Generation
// ──────────────────────────────────────────
export const generateBrandIdentity = async (userInputs = {}, context = {}) => {
  const result = {
    colors: {
      primary:   '#0F0F0F',
      secondary: '#F5F5F5',
      accent:    '#C6A96B',
      highlight: '#6B7CFF',
    },
    typography: {
      headline: 'Playfair Display',
      body:     'Inter',
      ui:       'Satoshi',
    },
    logos: [
      { type: 'Monogram', url: 'https://placehold.co/400x400/0F0F0F/C6A96B?text=B&font=playfair', style: 'monogram' },
      { type: 'Minimal Symbol', url: 'https://placehold.co/400x400/0F0F0F/F5F5F5?text=✧&font=inter', style: 'symbol' },
      { type: 'Wordmark', url: 'https://placehold.co/400x200/F5F5F5/0F0F0F?text=BRAND&font=playfair', style: 'wordmark' },
    ],
    brandScore:     92,
    brandArchetype: 'The Luxury Minimalist',
    brandVoice:     'Sophisticated, minimal, quietly confident',
  };

  await persistGeneration({
    ...context,
    generationType: 'brand_identity',
    prompt: JSON.stringify(userInputs),
    resultData: result,
    model: 'mock-v1',
    creditsUsed: 1,
  });

  return new Promise(resolve => setTimeout(() => resolve(result), 1500));
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
