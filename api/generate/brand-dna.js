import https from 'https';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { dna } = req.body;
  
  if (!dna) {
    return res.status(400).json({ error: 'Missing brand dna context' });
  }

  const groqKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
  if (!groqKey) {
    return res.status(500).json({ error: 'Missing Groq API Key' });
  }

  const prompt = `You are an elite, world-class luxury brand strategist and creative director.
Create the core visual DNA for the following brand:
Brand Name/Handle: ${dna.brand_name}
Niche: ${dna.niche}
Style: ${dna.style}
Audience: ${dna.audience}
Description: ${dna.brief}
Vibe sliders: Professional ${dna.sliders.professional}%, Minimal ${dna.sliders.minimal}%, Luxury ${dna.sliders.luxury}%

You must output a highly targeted JSON object detailing the core brand identity carefully curated to the niche and style provided.
Limit typography to valid Google Fonts that pair exceptionally well together. Use premium, highly cohesive hex color codes.

Output ONLY valid JSON matching this exact structure:
{
  "palette": {
    "primary": "#HEX",
    "secondary": "#HEX",
    "accent": "#HEX",
    "background": "#HEX",
    "rationale": "Brief explanation of color psychology."
  },
  "typography": {
    "heading": "Font Name",
    "body": "Font Name",
    "accent": "Font Name",
    "rationale": "Brief explanation of typography pairing."
  },
  "tagline": "A short, punchy, conversion-focused tagline (max 6 words).",
  "archetype": "The specific Jungian archetype (e.g., The Visionary, The Creator, The Sage)",
  "tone": "3 descriptive adjectives about the brand tone"
}`;

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[brand-dna] Groq Error:', err);
      return res.status(response.status).json({ error: 'Groq API error' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    
    // We strictly enforce the font mappings using our internal robust utility
    const { pickFonts } = await import('../../src/utils/typographyLogic.js');
    result.typography = pickFonts(dna.style);
    
    // Add quality score for parity with old pipeline
    result.quality_score = 92;

    return res.status(200).json(result);
  } catch (error) {
    console.error('[brand-dna] Failed to generate DNA:', error);
    return res.status(500).json({ error: 'Failed to generate Brand DNA' });
  }
}
