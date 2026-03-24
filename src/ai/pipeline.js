/**
 * pipeline.js
 * AI Generation Pipeline Orchestrator
 *
 * The main `generateBrandKit()` function runs all 6 generators
 * in sequence, reports progress via a callback, validates
 * every output, and uses the cache layer to avoid redundant
 * API calls for identical niche+style combinations.
 *
 * Usage:
 *   import { generateBrandKit } from './pipeline';
 *   await generateBrandKit(dna, (step) => setProgress(step));
 *
 * Progress steps (0–5):
 *   0  Building brand profile
 *   1  Generating color palette
 *   2  Generating logo concepts
 *   3  Selecting typography
 *   4  Creating templates
 *   5  Writing content ideas
 */

import { dnaCacheKey } from './brandDNA';
import {
  buildPalettePrompt,
  buildLogoPrompt,
  buildFontPrompt,
  buildTemplatePrompt,
  buildContentIdeasPrompt,
  buildHashtagPrompt,
} from './prompts';
import {
  safeParseJSON,
  validatePalette,
  validateFonts,
  validateIdeas,
  validateHashtags,
  validateTemplate,
  scorePalette,
} from './validators';
import { getCached, setCached, clearL1Cache } from './cache';
import { generateLogoVariations } from '../services/nvidiaService';

// ──────────────────────────────────────────
// Model tier assignment
// ──────────────────────────────────────────
const MODEL_TIERS = {
  brand_palette:   'llama-3.3-70b-versatile',  // text → JSON (Groq)
  logo:            'nvidia-sdxl',              // text → image (NVIDIA AI API)
  font_pairing:    'llama-3.3-70b-versatile',  // text → JSON (Groq)
  template:        'llama-3.3-70b-versatile',  // text → JSON (Groq)
  content_ideas:   'llama-3.3-70b-versatile',  // text → JSON (Groq)
  hashtags:        'llama-3.3-70b-versatile',  // text → JSON (Groq)
  bio:             'llama-3.3-70b-versatile',  // text → JSON (Groq)
  caption:         'llama-3.3-70b-versatile',  // text → text (Groq)
};

const CREDITS_PER_GEN = {
  brand_palette: 1,
  logo: 2,          // image models cost more
  font_pairing: 1,
  template: 1,
  content_ideas: 1,
  hashtags: 1,
  bio: 1,
};

// ──────────────────────────────────────────
// Mock AI caller (replace with real API client in production)
// In production: POST /api/ai/generate { type, prompt, model }
// Image generation handled by nvidiaService.js (NVIDIA AI API)
// ──────────────────────────────────────────
// ──────────────────────────────────────────
// Real Groq API caller
// ──────────────────────────────────────────
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = '/groq-api/openai/v1/chat/completions';
const USE_PROXY = import.meta.env.VITE_USE_AI_PROXY === 'true';
const TEXT_PROXY = '/api/ai-text';

const callAI = async (generationType, prompt, model) => {
  console.log(`[Pipeline] Calling Groq for ${generationType}`);
  try {
    let raw;
    if (USE_PROXY) {
      const res = await fetch(TEXT_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: generationType, prompt })
      });
      if (!res.ok) throw new Error(`Proxy error ${res.status}`);
      raw = await res.text();
    } else if (GROQ_KEY) {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.85,
          max_tokens: 1024,
          response_format: { type: 'json_object' }
        })
      });
      if (!res.ok) throw new Error(`Groq error ${res.status}`);
      const data = await res.json();
      raw = data.choices?.[0]?.message?.content || null;
    } else {
      return null; // No key, fall to mock
    }
    return raw;
  } catch (err) {
    console.error(`[Pipeline] callAI failed for ${generationType}:`, err.message);
    return null;
  }
};

// ──────────────────────────────────────────
// Smart Mocks (Dynamic fallbacks based on DNA)
// ──────────────────────────────────────────

const getDynamicPalette = (dna) => {
  // Style-based base palettes
  const stylePalettes = {
    luxury:          { primary: '#1A1A1A', secondary: '#FBFBFD', accent: '#C6A96B', background: '#FFFFFF' },
    minimal:         { primary: '#2D3436', secondary: '#FFFFFF', accent: '#0984E3', background: '#F9F9F9' },
    bold:            { primary: '#2D3436', secondary: '#FF7675', accent: '#6C5CE7', background: '#FFFFFF' },
    playful:         { primary: '#6C5CE7', secondary: '#FDCB6E', accent: '#E17055', background: '#FFFFFF' },
    'dark aesthetic':{ primary: '#0F0F0F', secondary: '#1A1A1A', accent: '#E0E0E0', background: '#050505' },
  };
  
  // Niche-based accent overrides that create meaningful variation
  const nicheAccents = {
    fitness:     { accent: '#E84393', primary: '#0A0A0A' },  // Hot pink / power
    travel:      { accent: '#00B894', primary: '#1E3A2F' },  // Teal / nature
    fashion:     { accent: '#D4A853', primary: '#1A1A1A' },  // Warm gold
    gaming:      { accent: '#00FFAB', primary: '#0D0D1A' },  // Neon green / dark
    technology:  { accent: '#4F8EF7', primary: '#0F1726' },  // Electric blue
    food:        { accent: '#FF6B35', primary: '#2D1A0E' },  // Warm orange / espresso
    real_estate: { accent: '#8B7355', primary: '#1C1C1C' },  // Warm taupe
    business:    { accent: '#C4A265', primary: '#1A1A2E' },  // Navy / gold
    lifestyle:   { accent: '#B89FD8', primary: '#1A1A1A' },  // Soft purple
    default:     { accent: '#C6A96B', primary: '#1A1A1A' },
  };
  
  const base = stylePalettes[dna.style] || stylePalettes.luxury;
  const nicheOverride = nicheAccents[dna.niche] || nicheAccents.default;
  
  return {
    ...base,
    ...nicheOverride,
    rationale: `${dna.style} ${dna.niche} palette with ${nicheOverride.accent} accent.`
  };
};


const getDynamicFonts = (dna) => {
  if (dna.style === 'luxury') return { heading: 'Playfair Display', body: 'Inter', accent: 'Satoshi', rationale: 'Elegant serif paired with modern sans-serif.' };
  if (dna.style === 'minimal') return { heading: 'Inter', body: 'Inter', accent: 'Space Mono', rationale: 'Geometric sans-serif for a clean, technical look.' };
  if (dna.style === 'bold') return { heading: 'Bebas Neue', body: 'Montserrat', accent: 'Inter', rationale: 'Strong display font for maximum impact.' };
  return { heading: 'Outfit', body: 'Inter', accent: 'Plus Jakarta Sans', rationale: 'Modern and versatile font pairing.' };
};

const getDynamicIdeas = (dna) => {
  const nicheLabel = dna.niche.replace(/_/g, ' ');
  const niche = nicheLabel.charAt(0).toUpperCase() + nicheLabel.slice(1);
  return [
    { title: `3 secrets to success in ${niche}`, hook: 'Want to know how the pros do it?', format: 'reel', angle: 'educational' },
    { title: `My ${niche} journey — starting from zero`, hook: 'I almost quit 3 times...', format: 'reel', angle: 'inspirational' },
    { title: `Mistakes to avoid as a ${niche} beginner`, hook: 'Stop wasting your time on this 🚫', format: 'carousel', angle: 'educational' },
    { title: `Unfiltered truth about the ${niche} industry`, hook: 'Real talk...', format: 'story', angle: 'controversial' },
    { title: `Week in my life: ${niche} edition`, hook: 'POV: you decided to take it seriously', format: 'reel', angle: 'lifestyle' },
  ];
};

const MOCK_LOGOS = [
  { style: 'monogram', url: 'https://placehold.co/400x400/1A1A1A/C6A96B?text=B&font=playfair', model_used: 'nvidia-sdxl' },
  { style: 'symbol',   url: 'https://placehold.co/400x400/1A1A1A/FBFBFD?text=✧&font=inter',   model_used: 'nvidia-sdxl' },
  { style: 'wordmark', url: 'https://placehold.co/400x200/FBFBFD/1A1A1A?text=BRAND&font=playfair', model_used: 'nvidia-sdxl' },
];

const MOCK_TEMPLATE = {
  canvas: '1080x1080',
  background_style: 'solid',
  elements: [
    { type: 'text',  role: 'headline',    position: { x: 10, y: 20 }, size: { w: 80, h: 20 }, style: 'large serif, primary color' },
    { type: 'image', role: 'hero',        position: { x: 0,  y: 40 }, size: { w: 100, h: 40 }, style: 'full-width photo' },
    { type: 'cta',   role: 'call_to_action', position: { x: 20, y: 85 }, size: { w: 60, h: 10 }, style: 'accent color button' },
  ],
};

// ──────────────────────────────────────────
// Individual Generator Functions
// ──────────────────────────────────────────

const generatePalette = async (dna, cacheKey) => {
  try {
    const cached = await getCached(cacheKey, 'brand_palette');
    if (cached) return { data: cached, fromCache: true };

    const prompt = buildPalettePrompt(dna);
    const raw = await callAI('brand_palette', prompt, MODEL_TIERS.brand_palette);
    
    // Use dynamic mock if no real AI output
    const dynamicFallback = getDynamicPalette(dna);
    const { data } = raw ? safeParseJSON(raw) : { data: dynamicFallback };
    
    const { valid } = validatePalette(data || dynamicFallback);
    const finalData = valid ? data : dynamicFallback;

    const score = scorePalette(finalData);
    await setCached(cacheKey, 'brand_palette', finalData);
    return { data: { ...finalData, quality_score: score }, fromCache: false };
  } catch (err) {
    const fallback = getDynamicPalette(dna);
    return { data: { ...fallback, quality_score: 80 }, fromCache: false };
  }
};

const generateFonts = async (dna, cacheKey) => {
  const cached = await getCached(cacheKey, 'font_pairing');
  if (cached) return { data: cached, fromCache: true };

  const prompt = buildFontPrompt(dna);
  const raw = await callAI('font_pairing', prompt, MODEL_TIERS.font_pairing);
  
  const dynamicFallback = getDynamicFonts(dna);
  const { data } = raw ? safeParseJSON(raw) : { data: dynamicFallback };

  const { valid } = validateFonts(data || dynamicFallback);
  const finalData = valid ? data : dynamicFallback;

  await setCached(cacheKey, 'font_pairing', finalData);
  return { data: finalData, fromCache: false };
};

const generateLogos = async (dna, palette) => {
  const logoTypes = ['monogram', 'symbol', 'wordmark'];

  // Build a focused SDXL prompt for each logo style
  const prompts = logoTypes.map(type => buildLogoPrompt(dna, palette, type));

  try {
    const urls = await generateLogoVariations(prompts, {
      model:  'nvidia-sdxl',
      steps:  30,
      guidanceScale: 8,     // higher = more prompt adherent (better for logos)
    });

    return logoTypes.map((style, i) => ({
      style,
      url:        urls[i],
      model_used: 'nvidia-sdxl',
      prompt:     prompts[i],
    }));
  } catch (err) {
    console.error('[Pipeline] Logo generation failed, using placeholders:', err.message);
    return MOCK_LOGOS;
  }
};

const generateTemplateLayouts = async (dna) => {
  const types = ['instagram_post', 'reel_cover', 'story'];
  const templates = await Promise.all(
    types.map(async (type) => {
      const prompt = buildTemplatePrompt(dna, type);
      const raw = await callAI('template', prompt, MODEL_TIERS.template);
      const { data } = raw ? safeParseJSON(raw) : { data: { ...MOCK_TEMPLATE, type } };
      const { valid } = validateTemplate(data || MOCK_TEMPLATE);
      return valid ? { ...data, type } : { ...MOCK_TEMPLATE, type };
    })
  );
  return templates;
};

const generateContentIdeas = async (dna) => {
  const prompt = buildContentIdeasPrompt(dna, 10);
  const raw = await callAI('content_ideas', prompt, MODEL_TIERS.content_ideas);
  
  const dynamicFallback = getDynamicIdeas(dna);
  const { data } = raw ? safeParseJSON(raw) : { data: dynamicFallback };
  
  const { data: validIdeas } = validateIdeas(data || dynamicFallback);
  return validIdeas;
};

const generateHashtags = async (dna) => {
  const prompt = buildHashtagPrompt(dna);
  const raw = await callAI('hashtags', prompt, MODEL_TIERS.hashtags);
  const { data } = raw ? safeParseJSON(raw) : {
    data: [
      { tag: '#luxurylifestyle',  category: 'large',  reach_est: 1200000 },
      { tag: '#creatorjourney',   category: 'medium', reach_est: 450000  },
      { tag: '#mindsetshift',     category: 'medium', reach_est: 890000  },
      { tag: '#aestheticfeed',    category: 'medium', reach_est: 670000  },
      { tag: '#brandidentity',    category: 'small',  reach_est: 320000  },
    ]
  };
  return validateHashtags(data || []);
};

// ──────────────────────────────────────────
// Main Entry Point — Full Brand Kit Pipeline
// ──────────────────────────────────────────

/**
 * @param {object} dna - Brand DNA from buildBrandDNA()
 * @param {function} onProgress - Callback: (step: number, label: string) => void
 * @returns {object} Full brand kit result
 */
export const generateBrandKit = async (dna, onProgress = () => {}) => {
  try {
    const cacheKey = dnaCacheKey(dna);
    const totalCredits = Object.values(CREDITS_PER_GEN).reduce((a, b) => a + b, 0);

    // Always clear in-memory cache for fresh generation
    clearL1Cache();
    console.log(`[Pipeline] Starting brand kit generation for key: ${cacheKey}`);
    
    // Step 0: Profile built
    onProgress(0, 'Building brand profile...');
    await new Promise(r => setTimeout(r, 400));

    // Step 1: Color Palette
    onProgress(1, 'Generating color palette...');
    const paletteResult = await generatePalette(dna, cacheKey);
    const palette = paletteResult.data;

    // Step 2: Logo
    onProgress(2, 'Creating logo concepts...');
    const logos = await generateLogos(dna, palette);

    // Step 3: Fonts
    onProgress(3, 'Selecting typography...');
    const fontsResult = await generateFonts(dna, cacheKey);
    const fonts = fontsResult.data;

    // Step 4: Templates
    onProgress(4, 'Building templates...');
    const templates = await generateTemplateLayouts(dna);

    // Step 5: Content Ideas
    onProgress(5, 'Writing content ideas...');
    const ideas = await generateContentIdeas(dna);
    const hashtags = await generateHashtags(dna);

    // Assemble final result
    const result = {
      dna,
      colors: {
        primary:    palette.primary,
        secondary:  palette.secondary,
        accent:     palette.accent,
        highlight:  palette.background,
      },
      palette,
      typography: {
        headline: fonts.heading,
        body:     fonts.body,
        ui:       fonts.accent,
      },
      logos,
      templates,
      contentIdeas: ideas,
      hashtags,
      brandScore:     paletteResult.data.quality_score || 92,
      brandArchetype: dna.brand_personality,
      brandVoice:     dna.tone,
      totalCreditsUsed: totalCredits,
      generatedAt: new Date().toISOString(),
    };

    console.log(`[Pipeline] Generation complete.`);
    return result;
  } catch (err) {
    console.error('[Pipeline] FATAL ERROR in brand kit generation:', err);
    // Return a bare-minimum valid result to prevent upstream crashes
    return {
      dna,
      colors: { primary: '#1A1A1A', secondary: '#FBFBFD', accent: '#C6A96B', highlight: '#FFFFFF' },
      palette: { primary: '#1A1A1A', secondary: '#FBFBFD', accent: '#C6A96B', background: '#FFFFFF' },
      typography: { headline: 'Playfair Display', body: 'Inter', ui: 'Satoshi' },
      logos: [],
      templates: [],
      contentIdeas: [],
      hashtags: [],
      brandScore: 80,
      brandArchetype: dna.brand_personality || 'Modern Professional',
      brandVoice: dna.tone || 'Professional',
      error_occurred: true
    };
  }
};

export { MODEL_TIERS, CREDITS_PER_GEN };
