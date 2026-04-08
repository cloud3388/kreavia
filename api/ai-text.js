/**
 * api/ai-text.js
 * Vercel Serverless Function — Groq Chat API Proxy with Fallback
 */

const GROQ_TEXT_URL = 'https://api.groq.com/openai/v1/chat/completions';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  if (!apiKey || apiKey.startsWith('gsk_YOUR')) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured.' });
  }

  const { dna, type = 'post', brandName, niche, audience, tone, pillars, existingHooks, topic, roughText } = req.body;

  let prompt = '';

  if (type === 'hooks') {
    const avoidHooks = existingHooks && existingHooks.length > 0 
      ? `\nDO NOT use or repeat any of these previously generated hooks:\n${JSON.stringify(existingHooks)}` 
      : '';
      
    prompt = `
      ROLE: Elite brand strategist and social media copywriter.
      CONTEXT: Generate viral content hooks for a brand.
      BRAND DETAILS:
      - Name: ${brandName || dna?.brand_name || 'The Brand'}
      - Niche: ${niche || dna?.niche || 'Lifestyle'}
      - Target Audience: ${audience || dna?.target_audience || 'General public'}
      - Tone of Voice: ${tone || dna?.tone || 'Engaging'}
      - Content Pillars: ${pillars ? JSON.stringify(pillars) : 'Value, Connection, Authority'}

      TASK: Generate exactly 10 unique content hooks.
      REQUIREMENTS:
      1. Produce at least 2 hooks for EACH of these formats: REEL HOOK, CAROUSEL HOOK, STORY HOOK, QUOTE HOOK, EDUCATIONAL HOOK.
      2. EACH hook must be completely different from the others. No two hooks should start with the same word or follow the same sentence structure.
      3. Make them highly engaging and tailored to the target audience and niche.${avoidHooks}

      OUTPUT FORMAT: Return valid JSON ONLY. It must be an array of exactly 10 objects:
      [
        {
          "contentType": "REEL HOOK",
          "title": "..."
        }
      ]
    `.trim();
  } else if (type === 'captions') {
    prompt = `
      ROLE: Elite social media manager and copywriter.
      CONTEXT: Generate exactly 3 caption variations for a social media post about this topic: "${topic}".
      BRAND DETAILS:
      - Name: ${brandName || dna?.brand_name || 'The Brand'}
      - Niche: ${niche || dna?.niche || 'Lifestyle'}
      - Tone of Voice: ${tone || dna?.tone || 'Engaging'}

      REQUIREMENTS:
      You must produce an array of exactly 3 JSON objects mapping to the 3 versions.
      Version 1 (type="Short"): 1-2 lines, punchy, ends with a question to drive comments. Uses the user's brand tone.
      Version 2 (type="Medium"): 4-6 lines with a hook first line, middle value, and a call to action at the end. Uses brand name naturally once.
      Version 3 (type="Story"): 8-10 lines. Opens with a personal scenario, delivers insight, ends with a relatable question. Warm and human tone.

      OUTPUT FORMAT: Return valid JSON ONLY. It must be an array of exactly 3 objects with keys "type" and "caption":
      [
        { "type": "Short", "caption": "..." },
        { "type": "Medium", "caption": "..." },
        { "type": "Story", "caption": "..." }
      ]
    `.trim();
  } else if (type === 'hashtag_strategy') {
    prompt = `
      ROLE: Elite Instagram Strategist.
      CONTEXT: Generate a hashtag strategy for this brand.
      BRAND DETAILS:
      - Name: ${brandName || dna?.brand_name || 'The Brand'}
      - Niche: ${niche || dna?.niche || 'Lifestyle'}
      - Tone of Voice: ${tone || dna?.tone || 'Engaging'}

      TASKS:
      Generate 3 distinct groups of hashtags:
      GROUP 1: "niche" - 10 highly relevant hashtags specific to the exact niche. Medium size.
      GROUP 2: "growth" - 10 medium size hashtags (100K-500K reach) to reach new audiences.
      GROUP 3: "brand" - 5 small, owned hashtags. One MUST be the brand name as a hashtag, others brand-specific phrases.

      OUTPUT FORMAT: Return valid JSON ONLY matching exactly this structure:
      {
        "niche": [{ "tag": "MinimalistLiving", "reach": "500K" }],
        "growth": [{ "tag": "SimpleLife", "reach": "250K" }],
        "brand": [{ "tag": "BrandName", "reach": "<10K" }]
      }
    `.trim();
  } else if (type === 'refine_voice') {
    prompt = `
      ROLE: Elite copywriter.
      CONTEXT: Refine this rough text to perfectly match the brand's tone of voice.
      BRAND DETAILS:
      - Name: ${brandName || dna?.brand_name || 'The Brand'}
      - Niche: ${niche || dna?.niche || 'Lifestyle'}
      - Tone of Voice: ${tone || dna?.tone || 'Engaging'}
      
      ROUGH TEXT:
      "${roughText}"

      TASK: Rewrite the rough text above. Enhance it to match the brand Tone of Voice precisely. Do not add conversational filler.
      OUTPUT FORMAT: Return valid JSON ONLY.
      {
        "result": "Your polished and refined text here."
      }
    `.trim();
  } else {
    prompt = `
      ROLE: Elite brand strategist and SD3 prompt engineer.
      CONTEXT: Brand DNA: ${JSON.stringify(dna)}
      TASK: Generate social media content for a ${type}.
      
      REQUIREMENTS:
      1. Caption: Engaging, matches brand tone, under 150 chars.
      2. Tagline: Punchy, memorable, fits brand personality.
      3. Image Prompt: Highly detailed SD3 prompt. Describe lighting, style (e.g. ${dna?.style}), and subject. No text in image.
      
      OUTPUT FORMAT: Return valid JSON only.
      {
        "caption": "...",
        "tagline": "...",
        "imagePrompt": "..."
      }
    `.trim();
  }

  // Helper to call Groq with a specific model
  const callGroq = async (model, promptString) => {
    return await fetch(GROQ_TEXT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: promptString }],
        temperature: 1,
        top_p: 1,
        max_tokens: 1024,
      }),
    });
  };

  try {
    let groqRes = await callGroq('llama-3.3-70b-versatile', prompt);
    let usedFallback = false;

    // Handle Rate Limit (429) by falling back to a faster model
    if (groqRes.status === 429) {
      console.warn('[ai-text] Primary model rate limited (429). Falling back to llama-3.1-8b-instant.');
      groqRes = await callGroq('llama-3.1-8b-instant', prompt);
      usedFallback = true;
    }

    if (!groqRes.ok) {
      const err = await groqRes.json().catch(() => ({}));
      return res.status(groqRes.status).json({ 
        error: `Groq API error (${groqRes.status}): ${err.error?.message || groqRes.statusText}`,
        fallback_used: usedFallback
      });
    }

    const data = await groqRes.json();
    const content = data.choices[0].message.content;
    
    // Attempt to extract JSON (object or array) if the model included extra text
    const jsonMatch = content.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

    // If the AI returned an array (hooks, captions), wrap it to avoid losing the array structure
    if (Array.isArray(result)) {
      return res.status(200).json({ data: result, _meta: { fallback_used: usedFallback } });
    }

    return res.status(200).json({
      ...result,
      _meta: { fallback_used: usedFallback }
    });
  } catch (err) {
    console.error('[ai-text] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
