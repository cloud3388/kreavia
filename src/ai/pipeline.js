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
import { pickFonts } from '../utils/typographyLogic';

// ──────────────────────────────────────────
// Model tier assignment
// ──────────────────────────────────────────
const MODEL_TIERS = {
  brand_palette:   'llama-3.3-70b-versatile',  // text → JSON (Groq)
  logo:            'nvidia-sd3',               // text → image (NVIDIA AI API)
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
  { style: 'monogram', url: 'https://placehold.co/400x400/1A1A1A/C6A96B?text=B&font=playfair', model_used: 'nvidia-sd3' },
  { style: 'symbol',   url: 'https://placehold.co/400x400/1A1A1A/FBFBFD?text=✧&font=inter',   model_used: 'nvidia-sd3' },
  { style: 'wordmark', url: 'https://placehold.co/400x200/FBFBFD/1A1A1A?text=BRAND&font=playfair', model_used: 'nvidia-sd3' },
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

  // Build a focused SD3 prompt for each logo style
  const prompts = logoTypes.map(type => buildLogoPrompt(dna, palette, type));

  try {
    const urls = await generateLogoVariations(prompts, {
      model:  'nvidia-sd3',
      steps:  28,
      guidanceScale: 8,     // higher = more prompt adherent (better for logos)
    });

    return logoTypes.map((style, i) => ({
      style,
      url:        urls[i],
      model_used: 'nvidia-sd3',
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

const NVIDIA_KEY = import.meta.env.VITE_NVIDIA_API_KEY;

export const generateStep1DNA = async (dna) => {
  if (USE_PROXY) {
    const res = await fetch('/api/generate/brand-dna', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dna })
    });
    if (!res.ok) throw new Error('Failed to generate brand DNA');
    return res.json();
  } else {
    const prompt = `You are an elite, world-class luxury brand strategist and creative director.\nCreate the core visual DNA for the following brand:\nBrand Name/Handle: ${dna.brand_name}\nNiche: ${dna.niche}\nStyle: ${dna.style}\nAudience: ${dna.audience}\nDescription: ${dna.brief}\n\nYou must output a highly targeted JSON object detailing the core brand identity carefully curated to the niche and style provided.\nLimit typography to valid Google Fonts that pair exceptionally well together. Use premium, highly cohesive hex color codes.\n\nOutput ONLY valid JSON matching this exact structure:\n{\n  "palette": {\n    "primary": "#HEX",\n    "secondary": "#HEX",\n    "accent": "#HEX",\n    "background": "#HEX",\n    "rationale": "..."\n  },\n  "typography": {\n    "heading": "Font Name",\n    "body": "Font Name",\n    "accent": "Font Name",\n    "rationale": "..."\n  },\n  "tagline": "A short, punchy, conversion-focused tagline (max 6 words).",\n  "archetype": "The specific Jungian archetype",\n  "tone": "3 descriptive adjectives about the brand tone"\n}`;
    const response = await fetch('/groq-api/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL_TIERS.brand_palette, messages: [{ role: 'user', content: prompt }],
        temperature: 0.7, max_tokens: 1024, response_format: { type: 'json_object' }
      })
    });
    const data = await response.json();
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    
    // Override generated typography intelligently
    result.typography = pickFonts(dna.style);
    
    return { ...result, quality_score: 92 };
  }
};

export const generateStep2Logo = async (dna, palette) => {
  if (USE_PROXY) {
    const res = await fetch('/api/generate/logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dna, palette })
    });
    if (!res.ok) throw new Error('Failed to generate logo');
    return res.json();
  } else {
    const niche = (dna.niche || '').toLowerCase();
    let baseConcept = 'clean geometric abstract mark, minimal professional icon';
    if (niche.includes('fitness')) baseConcept = 'athletic shield, lightning bolt, dynamic figure in motion';
    else if (niche.includes('lifestyle')) baseConcept = 'minimal leaf, sun ray, flowing ribbon, abstract organic shape';
    else if (niche.includes('fashion')) baseConcept = 'geometric diamond, crown, elegant abstract shape, fashion silhouette';
    else if (niche.includes('tech')) baseConcept = 'circuit node, hexagon, abstract connected dots, geometric tech shape';
    else if (niche.includes('food') || niche.includes('drink')) baseConcept = 'abstract bowl, leaf sprig, fork silhouette, organic drop shape';
    else if (niche.includes('business')) baseConcept = 'abstract upward arrow, geometric mountain peak, interlocked shapes';
    else if (niche.includes('gaming')) baseConcept = 'controller silhouette, pixel star, geometric game icon';
    else if (niche.includes('real estate')) baseConcept = 'abstract roof line, geometric house shape, key silhouette';
    else if (niche.includes('travel')) baseConcept = 'compass rose, abstract plane shape, mountain peak, globe outline';

    const styleStr = (dna.style || 'Premium').toLowerCase();
    let prompt = `A single minimalist vector logo icon of ${baseConcept}. ${dna.style} aesthetic design. Flat clean design, single color on pure white background, centered composition, no text, no letters, no words anywhere in the image, professional brand mark, scalable icon, thick clean outlines, simple geometric shapes only.`;

    if (styleStr.includes('luxury')) prompt += ' thin elegant lines, sophisticated, timeless, high-end';
    else if (styleStr.includes('minimal')) prompt += ' maximum negative space, ultra clean, simple single shape';
    else if (styleStr.includes('bold')) prompt += ' thick strokes, strong geometric, high impact, powerful';
    else if (styleStr.includes('playful')) prompt += ' rounded corners, friendly curves, soft approachable design';
    else if (styleStr.includes('dark aesthetic')) prompt += ' sleek sharp edges, mysterious, editorial, dark energy';

    const response = await fetch('/nvidia-api/v1/genai/black-forest-labs/flux-1-dev', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${NVIDIA_KEY}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        prompt: prompt,
        width: 1024, height: 1024, num_inference_steps: 30, guidance_scale: 7.5,
        seed: Math.floor(Math.random() * 9999) + 1,
        negative_prompt: 'text, letters, words, brand name, typography, font, alphabet, watermark, signature, blurry, low quality, realistic photo, human face, people'
      }),
    });
    const data = await response.json();
    let base64Image = '';
    if (data.artifacts && data.artifacts.length > 0 && data.artifacts[0].base64) base64Image = data.artifacts[0].base64;
    else if (data.image) base64Image = data.image;

    if (base64Image) {
      return { logos: [{ style: 'symbol', url: `data:image/png;base64,${base64Image}`, model_used: 'flux.1-dev' }] };
    }
    throw new Error('NVIDIA Image failed');
  }
};

export const generateStep3Content = async (dna) => {
  if (USE_PROXY) {
    const res = await fetch('/api/generate/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dna })
    });
    if (!res.ok) throw new Error('Failed to generate content strategy');
    return res.json();
  } else {
    const prompt = `You are a viral content strategist and creative director.\nCreate a comprehensive content strategy and social media templates for this brand:\nBrand Name: ${dna.brand_name}\nNiche: ${dna.niche}\nAudience: ${dna.audience}\nStyle: ${dna.style}\nBrief: ${dna.brief}\n\nOutput ONLY valid JSON matching this exact structure:\n{\n  "contentIdeas": [\n    {\n      "title": "Eye-catching title for the content piece",\n      "hook": "A scroll-stopping opening sentence",\n      "format": "reel" | "carousel" | "story",\n      "angle": "educational" | "inspirational" | "controversial" | "lifestyle"\n    }\n  ],\n  "templates": [\n    {\n      "type": "instagram_post",\n      "name": "Primary Value Post",\n      "text": "The main headline or quote for the graphic",\n      "canvas": "1080x1080"\n    },\n    {\n      "type": "reel_cover",\n      "name": "Reel Cover",\n      "text": "A massive, bold title for a short-form video",\n      "canvas": "1080x1920"\n    },\n    {\n      "type": "story",\n      "name": "Engagement Story",\n      "text": "An interactive question or poll text",\n      "canvas": "1080x1920"\n    }\n  ],\n  "hashtags": [\n    {\n      "tag": "#ExactHashtagWithHash",\n      "category": "large" | "medium" | "small",\n      "reach_est": 500000\n    }\n  ]\n}\n\nMake sure you generate exactly 5 varied contentIdeas, precisely 3 templates (one of each type), and exactly 10 highly relevant hashtags.`;
    const response = await fetch('/groq-api/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL_TIERS.template, messages: [{ role: 'user', content: prompt }],
        temperature: 0.8, max_tokens: 1500, response_format: { type: 'json_object' }
      })
    });
    const data = await response.json();
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
  }
};

export { MODEL_TIERS, CREDITS_PER_GEN };
