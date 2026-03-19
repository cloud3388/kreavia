/**
 * brandDNA.js
 * Transforms raw onboarding form inputs into a structured
 * Brand DNA object — the central context for all AI generators.
 *
 * Brand DNA shape:
 * {
 *   niche, style, audience, tone,
 *   visual_energy, brand_personality,
 *   color_direction, content_formats,
 *   generated_at
 * }
 */

// ──────────────────────────────────────────
// Mapping tables (onboarding → DNA)
// ──────────────────────────────────────────

const NICHE_TONE_MAP = {
  fitness:    { tone: 'motivational powerful', color_direction: 'bold dark with gold accents', brand_personality: 'driven premium' },
  travel:     { tone: 'aspirational wanderlust', color_direction: 'warm earthy neutrals', brand_personality: 'adventurous curated' },
  fashion:    { tone: 'editorial luxury', color_direction: 'monochrome with accent pop', brand_personality: 'sophisticated trendsetter' },
  gaming:     { tone: 'energetic bold', color_direction: 'dark neon contrast', brand_personality: 'dynamic playful' },
  technology: { tone: 'innovative visionary', color_direction: 'sleek tech blue or dark mode', brand_personality: 'cutting-edge expert' },
  food:       { tone: 'sensory inviting', color_direction: 'appetizing warm tones', brand_personality: 'flavor-focused artisan' },
  real_estate: { tone: 'trustworthy premium', color_direction: 'sophisticated neutral navy or gold', brand_personality: 'reliable luxury' },
  business:   { tone: 'authoritative confident', color_direction: 'dark professional with gold', brand_personality: 'expert trust-builder' },
  lifestyle:  { tone: 'elegant aspirational', color_direction: 'soft neutral luxury palette', brand_personality: 'mindful refined' },
  default:    { tone: 'professional inspiring', color_direction: 'clean minimal palette', brand_personality: 'modern authentic' },
};

const STYLE_ENERGY_MAP = {
  luxury:     { visual_energy: 'minimal refined',     typography_direction: 'serif heading, clean sans body' },
  minimal:    { visual_energy: 'ultra clean',          typography_direction: 'geometric sans pair' },
  bold:       { visual_energy: 'high contrast dynamic', typography_direction: 'display + condensed sans' },
  playful:    { visual_energy: 'warm bright',          typography_direction: 'rounded friendly fonts' },
  'dark aesthetic': { visual_energy: 'moody cinematic', typography_direction: 'editorial serif + monospace' },
  default:    { visual_energy: 'balanced',             typography_direction: 'classic versatile pair' },
};

const AUDIENCE_CONTENT_MAP = {
  'Entrepreneurs':     { content_formats: ['carousel', 'talking_head', 'infographic'], posting_cadence: '5x/week' },
  'Women 18-30':       { content_formats: ['reel', 'story', 'aesthetic_post'], posting_cadence: '7x/week' },
  'Gen Z':            { content_formats: ['reel', 'story', 'meme_post', 'short_form'], posting_cadence: '10x/week' },
  'Gamers':            { content_formats: ['clip', 'thumbnail', 'meme_post'], posting_cadence: '4x/week' },
  'Corporate':         { content_formats: ['infographic', 'article', 'professional_post'], posting_cadence: '3x/week' },
  'Small Business':    { content_formats: ['behind_the_scenes', 'product_shot', 'customer_story'], posting_cadence: '5x/week' },
  'Freelancers':       { content_formats: ['portfolio_piece', 'tutorial', 'case_study'], posting_cadence: '4x/week' },
  'Tech Enthusiasts':  { content_formats: ['review', 'news_update', 'unboxing'], posting_cadence: '5x/week' },
  'Fitness beginners': { content_formats: ['reel', 'carousel', 'challenge_post'], posting_cadence: '6x/week' },
  'Luxury lifestyle':  { content_formats: ['aesthetic_post', 'story', 'reel'], posting_cadence: '5x/week' },
  'default':           { content_formats: ['reel', 'post', 'story'], posting_cadence: '5x/week' },
};

// Personality slider labels → text
const sliderToLabel = (value) => {
  const v = parseInt(value, 10);
  if (v < 25) return 'very_low';
  if (v < 50) return 'low';
  if (v === 50) return 'balanced';
  if (v < 75) return 'high';
  return 'very_high';
};

// ──────────────────────────────────────────
// buildBrandDNA
// Input: OnboardingPage formData
// ──────────────────────────────────────────
export const buildBrandDNA = (formData) => {
  const {
    niche = 'lifestyle',
    vibe = 'luxury',
    audience = 'Entrepreneurs',
    professionalLevel = 50,
    minimalLevel = 50,
    luxuryLevel = 50,
  } = formData;

  const nicheMap  = NICHE_TONE_MAP[niche]      || NICHE_TONE_MAP.default;
  const styleMap  = STYLE_ENERGY_MAP[vibe]      || STYLE_ENERGY_MAP.default;
  const audMap    = AUDIENCE_CONTENT_MAP[audience] || AUDIENCE_CONTENT_MAP.default;

  const dna = {
    // Core identity
    niche,
    style:             vibe,
    audience,

    // Voice & personality
    tone:              nicheMap.tone,
    brand_personality: nicheMap.brand_personality,

    // Visual direction
    visual_energy:       styleMap.visual_energy,
    color_direction:     nicheMap.color_direction,
    typography_direction: styleMap.typography_direction,

    // Personality sliders (raw + label)
    sliders: {
      professional_vs_fun:    { value: professionalLevel, label: sliderToLabel(professionalLevel) },
      minimal_vs_bold:        { value: minimalLevel,      label: sliderToLabel(minimalLevel) },
      luxury_vs_casual:       { value: luxuryLevel,       label: sliderToLabel(luxuryLevel) },
    },

    // Content strategy
    content_formats:  audMap.content_formats,
    posting_cadence:  audMap.posting_cadence,

    // Safety & quality
    safe_content: true,
    generated_at: new Date().toISOString(),
  };

  return dna;
};

// ──────────────────────────────────────────
// Summarise DNA into a short human-readable brand brief
// Used for display in UI and for debug
// ──────────────────────────────────────────
export const dnaToSummary = (dna) => {
  return `${dna.style} ${dna.niche} brand for ${dna.audience}. ` +
    `Tone: ${dna.tone}. Visual energy: ${dna.visual_energy}.`;
};

// ──────────────────────────────────────────
// Generate a cache key from DNA (for palette/font caching)
// ──────────────────────────────────────────
export const dnaCacheKey = (dna) => {
  return `${dna.niche}::${dna.style}::${dna.sliders.minimal_vs_bold.label}::${dna.sliders.luxury_vs_casual.label}`;
};
