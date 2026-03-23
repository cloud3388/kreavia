/**
 * prompts.js
 * All structured AI prompt templates.
 * Each prompt follows the 4-section structure:
 *   ROLE / CONTEXT / INSTRUCTIONS / OUTPUT FORMAT
 *
 * Usage:
 *   import { buildPalettePrompt } from './prompts';
 *   const prompt = buildPalettePrompt(dna);
 */

// ──────────────────────────────────────────
// 1. Brand Color Palette Prompt
// ──────────────────────────────────────────
export const buildPalettePrompt = (dna) => `
ROLE
You are a world-class brand designer specialising in creator identity systems.

CONTEXT
Create a social media brand color palette for a creator with the following profile:
${JSON.stringify(dna, null, 2)}

INSTRUCTIONS
Generate a modern, visually cohesive color palette suitable for Instagram, TikTok, and YouTube branding.

Requirements:
- Align with the brand's visual_energy: "${dna.visual_energy}"
- Reflect the color_direction: "${dna.color_direction}"
- High contrast for social media legibility
- Aesthetically appropriate for the "${dna.niche}" niche
- Modern creator branding, not corporate

Include exactly 4 colors:
- primary   (dominant brand color)
- secondary (supporting light color)
- accent    (highlight / CTA color)
- background (page / story background)

OUTPUT FORMAT
Return valid JSON only. No extra text. No markdown fences.
{
  "primary": "#HEXCODE",
  "secondary": "#HEXCODE",
  "accent": "#HEXCODE",
  "background": "#HEXCODE",
  "rationale": "One sentence explaining the palette choice"
}
`.trim();

// ──────────────────────────────────────────
// 2. Logo Generator Prompt (Image Model)
// ──────────────────────────────────────────
export const buildLogoPrompt = (dna, palette, logoType = 'monogram') => `
Minimal luxury ${logoType} logo for a ${dna.niche} creator brand named "${dna.brand_name}".

Brand personality: ${dna.brand_personality}
Style: ${dna.style}
Visual energy: ${dna.visual_energy}
Brand Brief: ${dna.brief}

Design requirements:
- minimal, clean, modern
- premium aesthetic
- Instagram and TikTok ready
- scalable at small sizes
- the logo text must read exactly "${dna.brand_name}"

Color palette:
Primary: ${palette.primary}
Accent: ${palette.accent}
Background: ${palette.background}

Logo type: ${logoType}
Render on a clean neutral background.
No gradients. Vector art style.
`.trim();

// ──────────────────────────────────────────
// 3. Font Pairing Prompt
// ──────────────────────────────────────────
export const buildFontPrompt = (dna) => `
ROLE
You are a professional typography expert specialising in digital creator branding.

CONTEXT
Select a font pairing for a creator with this brand profile:
${JSON.stringify({ niche: dna.niche, style: dna.style, tone: dna.tone, typography_direction: dna.typography_direction }, null, 2)}

INSTRUCTIONS
- Heading font: strong, recognisable, on-brand
- Body font: highly readable, pairs well with heading
- Accent font: decorative or unique, used for short labels and UI elements
- All fonts must be available on Google Fonts
- Must feel modern and Instagram-friendly
- Avoid overused fonts (Helvetica, Times New Roman, Comic Sans)

OUTPUT FORMAT
Return valid JSON only. No extra text.
{
  "heading": "Font Name",
  "body": "Font Name",
  "accent": "Font Name",
  "rationale": "One sentence explaining the pairing"
}
`.trim();

// ──────────────────────────────────────────
// 4. Instagram Template Layout Prompt
// ──────────────────────────────────────────
export const buildTemplatePrompt = (dna, templateType = 'instagram_post') => `
ROLE
You are a senior social media designer and visual systems expert.

CONTEXT
Create a design layout structure for a ${templateType} template.

Brand profile:
${JSON.stringify({ niche: dna.niche, style: dna.style, visual_energy: dna.visual_energy, tone: dna.tone }, null, 2)}

INSTRUCTIONS
Design a canvas layout with specific element positions.
Keep the layout minimal and premium in line with the brand's visual energy.
Ensure the layout works for the specified template type.
All position values are percentages of canvas width/height.

OUTPUT FORMAT
Return valid JSON only. No extra text.
{
  "canvas": "1080x1080",
  "background_style": "solid | gradient | image_overlay",
  "elements": [
    {
      "type": "text | image | shape | cta | logo",
      "role": "headline | subheadline | body | decoration",
      "position": { "x": 0-100, "y": 0-100 },
      "size": { "w": 0-100, "h": 0-100 },
      "style": "description of styling"
    }
  ]
}
`.trim();

// ──────────────────────────────────────────
// 5. Caption Generator Prompt
// ──────────────────────────────────────────
export const buildCaptionPrompt = (dna, contentIdea) => `
ROLE
You are an elite Instagram content strategist and copywriter.

CONTEXT
Brand tone: ${dna.tone}
Niche: ${dna.niche}
Audience: ${dna.audience}
Brand personality: ${dna.brand_personality}

INSTRUCTIONS
Write a compelling Instagram caption for this content idea:
"${contentIdea}"

Rules:
- Match the brand tone exactly
- Short punchy paragraphs (max 2 lines each)
- Include 1-3 relevant emojis (not excessive)
- End with a strong CTA (save, comment, follow, share)
- Total length: 80-200 words
- No hashtags in the caption body
- Make first line a powerful hook that stops the scroll

OUTPUT FORMAT
Return the caption text only. No JSON. No extra explanation.
`.trim();

// ──────────────────────────────────────────
// 6. Content Ideas Generator Prompt
// ──────────────────────────────────────────
export const buildContentIdeasPrompt = (dna, count = 10) => `
ROLE
You are a viral content strategist with 10+ years creating content for top creators.

CONTEXT
Creator profile:
${JSON.stringify({ niche: dna.niche, audience: dna.audience, tone: dna.tone, content_formats: dna.content_formats }, null, 2)}

INSTRUCTIONS
Generate ${count} short-form video content ideas for this creator.

Focus on:
- Strong viral hooks that create curiosity
- Relatable moments the audience experiences
- Trending formats: POV, Day in the life, Myth-busting, Tutorial, Reaction
- Ideas that match the brand tone and personality
- Mix of content types: educational, inspirational, entertaining

OUTPUT FORMAT
Return valid JSON array only. No extra text.
[
  {
    "title": "Idea headline",
    "hook": "The opening line for the video",
    "format": "reel | carousel | story | post",
    "angle": "educational | inspirational | entertaining | controversial"
  }
]
`.trim();

// ──────────────────────────────────────────
// 7. Hashtag Generator Prompt
// ──────────────────────────────────────────
export const buildHashtagPrompt = (dna) => `
ROLE
You are a social media growth strategist specialising in hashtag research.

CONTEXT
Creator niche: ${dna.niche}
Audience: ${dna.audience}
Brand style: ${dna.style}

INSTRUCTIONS
Generate 20 Instagram hashtags for this creator.

Include a strategic mix:
- 5 large hashtags (1M+ posts) for discovery
- 10 medium hashtags (100K–1M posts) for reach
- 5 small/niche hashtags (under 100K posts) for targeted engagement

Avoid:
- Banned hashtags
- Generic overused tags (#love, #instagood)
- Irrelevant tags

OUTPUT FORMAT
Return valid JSON array only.
[
  { "tag": "#tagname", "category": "large | medium | small", "reach_est": 000000 }
]
`.trim();

// ──────────────────────────────────────────
// 8. Bio Generator Prompt
// ──────────────────────────────────────────
export const buildBioPrompt = (dna) => `
ROLE
You are an Instagram profile copywriter.

CONTEXT
Creator profile:
Niche: ${dna.niche}
Tone: ${dna.tone}
Audience: ${dna.audience}
Brand personality: ${dna.brand_personality}

INSTRUCTIONS
Write 3 alternative Instagram bio options.

Each bio must:
- Be under 150 characters
- Include a value proposition relevant to the audience
- Match the brand tone
- End with a subtle CTA or differentiator
- Feel premium, not generic

OUTPUT FORMAT
Return valid JSON array only.
[
  { "bio": "Bio text here", "style": "minimal | bold | storytelling" }
]
`.trim();
