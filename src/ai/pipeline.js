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
import { getCached, setCached } from './cache';
import { generateLogoVariations } from '../services/nvidiaService';

// ──────────────────────────────────────────
// Model tier assignment
// ──────────────────────────────────────────
const MODEL_TIERS = {
  brand_palette:   'gpt-4o',       // text → JSON
  logo:            'nvidia-sdxl',  // text → image (NVIDIA AI API)
  font_pairing:    'gpt-4o-mini',  // text → JSON (cheaper)
  template:        'gpt-4o-mini',  // text → JSON
  content_ideas:   'gpt-4o-mini',  // text → JSON
  hashtags:        'gpt-4o-mini',  // text → JSON
  bio:             'gpt-4o-mini',  // text → JSON
  caption:         'gpt-4o',       // text → text
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
const callAI = async (generationType, prompt, model) => {
  console.log(`[Pipeline] Calling ${model} for ${generationType}`);
  // Simulate latency based on model tier
  const latency = model.includes('gpt-4o') ? 1200 : model.includes('sdxl') ? 2000 : 800;
  await new Promise(r => setTimeout(r, latency));
  return null; // In production: returns AI output string
};

// ──────────────────────────────────────────
// Mock fallback data (used when no real API)
// ──────────────────────────────────────────
const MOCK_PALETTE = {
  primary: '#1A1A1A',
  secondary: '#FBFBFD',
  accent: '#C6A96B',
  background: '#FFFFFF',
  rationale: 'Clean minimalist aesthetic with premium gold accents.',
};

const MOCK_FONTS = {
  heading: 'Playfair Display',
  body: 'Inter',
  accent: 'Bebas Neue',
  rationale: 'Elegant serif heading paired with clean modern sans for maximum readability.',
};

const MOCK_IDEAS = [
  { title: 'Things nobody tells you about this niche', hook: 'Nobody talks about this...', format: 'reel', angle: 'controversial' },
  { title: 'My morning routine that changed everything', hook: 'I wasted 2 years doing this wrong', format: 'reel', angle: 'educational' },
  { title: '3 mistakes beginners make (and how to fix them)', hook: 'Stop doing this immediately 🚫', format: 'carousel', angle: 'educational' },
  { title: 'Behind the scenes: reality vs Instagram', hook: 'Real talk...', format: 'story', angle: 'entertaining' },
  { title: 'Week in my life — unfiltered', hook: 'POV: you decided to actually go for it', format: 'reel', angle: 'inspirational' },
];

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
    const { data, error } = raw ? safeParseJSON(raw) : { data: MOCK_PALETTE, error: null };
    
    const { valid, errors } = validatePalette(data || MOCK_PALETTE);
    const finalData = valid ? data : MOCK_PALETTE;

    const score = scorePalette(finalData);
    await setCached(cacheKey, 'brand_palette', finalData);
    return { data: { ...finalData, quality_score: score }, fromCache: false };
  } catch (err) {
    console.warn('[Pipeline] Palette generation failed, using mocks:', err);
    return { data: { ...MOCK_PALETTE, quality_score: 80 }, fromCache: false };
  }
};

const generateFonts = async (dna, cacheKey) => {
  const cached = await getCached(cacheKey, 'font_pairing');
  if (cached) return { data: cached, fromCache: true };

  const prompt = buildFontPrompt(dna);
  const raw = await callAI('font_pairing', prompt, MODEL_TIERS.font_pairing);
  const { data, error } = raw ? safeParseJSON(raw) : { data: MOCK_FONTS, error: null };
  if (error) throw new Error(`Font parse failed: ${error}`);

  const { valid, errors } = validateFonts(data);
  if (!valid) throw new Error(`Fonts invalid: ${errors.join(', ')}`);

  await setCached(cacheKey, 'font_pairing', data);
  return { data, fromCache: false };
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
  const { data } = raw ? safeParseJSON(raw) : { data: MOCK_IDEAS };
  const { data: validIdeas } = validateIdeas(data || MOCK_IDEAS);
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
  const cacheKey = dnaCacheKey(dna);
  const totalCredits = Object.values(CREDITS_PER_GEN).reduce((a, b) => a + b, 0);

  console.log(`[Pipeline] Starting brand kit generation for key: ${cacheKey}`);
  console.log(`[Pipeline] Estimated credits: ${totalCredits}`);

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

  console.log(`[Pipeline] Generation complete. Credits used: ${totalCredits}`);
  return result;
};

export { MODEL_TIERS, CREDITS_PER_GEN };
