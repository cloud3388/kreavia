/**
 * aiService.js
 * AI generation layer — mock responses for local dev.
 * In production, replace each function with a backend API call
 * (e.g. POST /api/generate/brand-identity) that:
 *   1. Deducts credits via userService.deductCredits()
 *   2. Calls NVIDIA AI API / OpenAI
 *   3. Persists result in ai_generations + ai_usage tables
 *   4. Returns result_data to the frontend
 */
import { supabase, isMockMode } from '../lib/supabase';
import { generateImage } from './nvidiaService';

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

    await supabase.from('ai_usage').insert({
      user_id: userId,
      generation_type: generationType,
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
    `A minimalist and luxurious logo mark, sleek geometric shapes, sophisticated aesthetic, black and white with a subtle hint of gold, premium brand identity, high-end editorial style, clean lines, vector art style. for "${brandName}"`,
    `A minimalist abstract symbol, sleek geometric shapes, sophisticated aesthetic, black and white with a subtle hint of gold, premium brand identity, clean lines, vector art style. for "${brandName}"`,
  ];

  try {
    // 1. Attempt to generate real AI logos
    let logo1, logo2;
    try {
      [logo1, logo2] = await Promise.all([
        generateImage(logoPrompts[0]),
        generateImage(logoPrompts[1]),
      ]);
    } catch (imageErr) {
      console.warn('[AI Service] Logo generation failed, using placeholders:', imageErr);
      logo1 = `https://placehold.co/400x400/1A1A1A/C6A96B?text=${brandName[0]}&font=playfair`;
      logo2 = `https://placehold.co/400x400/FBFBFD/1A1A1A?text=${brandName[0]}&font=satoshi`;
    }

    const result = {
      brandName,
      industry,
      colors: {
        primary:   '#0A0A0A', // Dark
        secondary: '#FAFAFA', // Light
        accent:    '#CBA135', // Gold
        highlight: '#2A2A2A', // Darker gray
      },
      typography: {
        headline: 'Playfair Display',
        body:     'Inter',
        ui:       'JetBrains Mono',
      },
      logos: [
        { type: 'Primary Logo', url: logo1, style: 'vector' },
        { type: 'Minimal Symbol', url: logo2, style: 'symbol' },
      ],
      brandScore:     95,
      brandArchetype: 'The Magician',
      brandVoice:     'Sophisticated, Visionary, Direct',
    };

    await persistGeneration({
      ...context,
      generationType: 'brand_identity',
      prompt: JSON.stringify(userInputs),
      resultData: result,
      model: 'nvidia-sdxl',
      creditsUsed: 1,
    });

    return result;
  } catch (err) {
    console.error('[AI Service] Brand Identity generation failed:', err);
    // Ultimate fallback to return SOMETHING
    return {
      brandName,
      industry,
      colors: { primary: '#0A0A0A', secondary: '#FAFAFA', accent: '#CBA135', highlight: '#2A2A2A' },
      typography: { headline: 'Playfair Display', body: 'Inter', ui: 'JetBrains Mono' },
      logos: [{ type: 'Fallback', url: `https://placehold.co/400x400/0A0A0A/CBA135?text=${brandName[0]}`, style: 'vector' }],
      brandScore: 90,
      brandArchetype: 'The Magician',
      brandVoice: 'Sophisticated, Visionary, Direct',
    };
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

// ──────────────────────────────────────────
// Templates Generation
// ──────────────────────────────────────────
export const generateTemplates = async (brandData, context = {}) => {
  const brandName = brandData?.brandName || 'Brand';
  const niche = brandData?.industry || 'lifestyle';
  const tone = brandData?.brandVoice || 'luxury';

  const templates = [
    { id: 1, type: 'quote', name: 'Daily Inspiration', text: `The essence of ${niche} is not in doing more, but in being more.` },
    { id: 2, type: 'reel_cover', name: 'The Masterclass', text: `THE ${brandName.toUpperCase()} BLUEPRINT` },
    { id: 3, type: 'story', name: 'Quick Tip', text: `${brandName} RESOURCES` },
    { id: 4, type: 'carousel', name: 'Value Swipe', text: `3 Ways to Elevate Your ${niche.charAt(0).toUpperCase() + niche.slice(1)} Game →` },
    { id: 5, type: 'educational', name: 'Pro Wisdom', text: `How to maintain consistency across all your platforms with ${brandName}.` },
    { id: 6, type: 'quote', name: 'Bold Statement', text: `${tone.charAt(0).toUpperCase() + tone.slice(1)} is not just an aesthetic, it's a lifestyle.` }
  ];

  await persistGeneration({
    ...context,
    generationType: 'templates',
    prompt: `brand:${brandName},niche:${niche}`,
    resultData: { templates },
    model: 'gpt-4o-mock',
    creditsUsed: 1,
  });

  return new Promise(resolve => setTimeout(() => resolve(templates), 1500));
};
