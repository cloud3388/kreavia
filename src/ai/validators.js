/**
 * validators.js
 * AI Output Validation Layer
 *
 * All AI outputs must pass through validators before being
 * stored or displayed. Invalid outputs trigger a regeneration.
 *
 * Validators:
 *   - validatePalette()    — HEX codes, contrast ratios
 *   - validateFonts()      — Google Fonts existence check
 *   - validateJSON()       — Safe JSON parser
 *   - validateContent()    — Safety filters (no banned content)
 *   - validateHashtags()   — Format + banned tag check
 *   - scorePalette()       — Quality score (0-100)
 */

// ──────────────────────────────────────────
// Safe JSON Parser
// ──────────────────────────────────────────
export const safeParseJSON = (raw) => {
  try {
    // Strip markdown code fences if model wraps output
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    return { data: JSON.parse(cleaned), error: null };
  } catch (err) {
    return { data: null, error: `JSON parse failed: ${err.message}` };
  }
};

// ──────────────────────────────────────────
// HEX Color Validator
// ──────────────────────────────────────────
const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export const isValidHex = (hex) => HEX_REGEX.test(hex);

export const validatePalette = (palette) => {
  const errors = [];
  const required = ['primary', 'secondary', 'accent', 'background'];

  for (const key of required) {
    if (!palette[key]) {
      errors.push(`Missing required color: ${key}`);
    } else if (!isValidHex(palette[key])) {
      errors.push(`Invalid HEX for ${key}: "${palette[key]}"`);
    }
  }

  return { valid: errors.length === 0, errors };
};

// ──────────────────────────────────────────
// Contrast Ratio (WCAG relative luminance)
// ──────────────────────────────────────────
const hexToRgb = (hex) => {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const int = parseInt(full, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
};

const relativeLuminance = ({ r, g, b }) => {
  const [R, G, B] = [r, g, b].map(v => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

export const contrastRatio = (hex1, hex2) => {
  const L1 = relativeLuminance(hexToRgb(hex1));
  const L2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(L1, L2);
  const darker  = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
};

// ──────────────────────────────────────────
// Palette Quality Score (0-100)
// ──────────────────────────────────────────
export const scorePalette = (palette) => {
  if (!validatePalette(palette).valid) return 0;

  let score = 50; // base
  const primaryBgContrast = contrastRatio(palette.primary, palette.background);

  if (primaryBgContrast >= 7) score += 30;       // AAA contrast
  else if (primaryBgContrast >= 4.5) score += 20; // AA contrast
  else if (primaryBgContrast >= 3) score += 10;   // AA Large

  const accentContrast = contrastRatio(palette.accent, palette.background);
  if (accentContrast >= 3) score += 20;

  return Math.min(100, score);
};

// ──────────────────────────────────────────
// Google Fonts Subset (commonly used brands)
// In production, call Google Fonts API to verify
// ──────────────────────────────────────────
const KNOWN_GOOGLE_FONTS = new Set([
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Raleway',
  'Playfair Display', 'Merriweather', 'Josefin Sans', 'Oswald',
  'Poppins', 'Nunito', 'Source Sans Pro', 'Bebas Neue', 'DM Sans',
  'DM Serif Display', 'Satoshi', 'Cabinet Grotesk', 'Clash Display',
  'Cormorant Garamond', 'EB Garamond', 'Space Grotesk', 'Syne',
  'Outfit', 'Plus Jakarta Sans', 'Barlow', 'Work Sans', 'Urbanist',
]);

export const validateFonts = (fonts) => {
  const errors = [];
  const required = ['heading', 'body', 'accent'];

  for (const key of required) {
    if (!fonts[key]) {
      errors.push(`Missing font: ${key}`);
    } else if (!KNOWN_GOOGLE_FONTS.has(fonts[key])) {
      // Non-fatal: just warn, still allow
      console.warn(`[Validator] Unknown font "${fonts[key]}" — may not be on Google Fonts`);
    }
  }

  return { valid: errors.length === 0, errors };
};

// ──────────────────────────────────────────
// Content Safety Filter
// ──────────────────────────────────────────
const BANNED_TERMS = [
  'violence', 'sexual', 'nsfw', 'explicit', 'political', 'racist',
  'hate', 'adult content', 'illegal', 'drug', 'weapon',
];

export const validateContentSafety = (text) => {
  const lower = text.toLowerCase();
  const violations = BANNED_TERMS.filter(term => lower.includes(term));
  return {
    safe: violations.length === 0,
    violations,
  };
};

export const validateIdeas = (ideas) => {
  if (!Array.isArray(ideas) || ideas.length === 0) {
    return { valid: false, errors: ['No ideas returned'] };
  }
  const filtered = ideas.filter(idea => {
    const text = typeof idea === 'string' ? idea : idea.title || '';
    return validateContentSafety(text).safe;
  });
  return { valid: true, data: filtered, filtered: ideas.length - filtered.length };
};

// ──────────────────────────────────────────
// Hashtag Validator
// ──────────────────────────────────────────
const BANNED_HASHTAGS = new Set(['#follow4follow', '#like4like', '#f4f', '#l4l', '#spam']);
const HASHTAG_REGEX = /^#[a-zA-Z0-9_]+$/;

export const validateHashtags = (hashtags) => {
  return hashtags.filter(h => {
    const tag = typeof h === 'string' ? h : h.tag;
    return HASHTAG_REGEX.test(tag) && !BANNED_HASHTAGS.has(tag.toLowerCase());
  });
};

// ──────────────────────────────────────────
// Template Layout Validator
// ──────────────────────────────────────────
export const validateTemplate = (template) => {
  const errors = [];
  if (!template.canvas)   errors.push('Missing canvas dimensions');
  if (!Array.isArray(template.elements) || template.elements.length === 0) {
    errors.push('Template has no elements');
  }
  return { valid: errors.length === 0, errors };
};
