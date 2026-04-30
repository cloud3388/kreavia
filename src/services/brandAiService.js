/**
 * brandAiService.js
 * Frontend service to interact with our AI text generation proxy.
 */

const API_URL = '/api/ai-text';
const DIRECT_TEXT_URL = '/groq-api/openai/v1/chat/completions';
const groqKey = import.meta.env.VITE_GROQ_API_KEY;
const useProxy = import.meta.env.VITE_USE_AI_PROXY === 'true';

/**
 * Persist generation to simple logging service or console
 */
const persistGeneration = (type, data) => {
  console.log(`[AI SERVICE] Generated ${type}:`, data);
};

const extractBrandInfo = (brandData) => {
  const dna = brandData?.dna || {};
  return {
    name: brandData?.brandName || dna.brand_name || 'Kreavia Brand',
    niche: brandData?.industry || brandData?.niche || dna.niche || 'Lifestyle',
    audience: brandData?.targetAudience || dna.audience || 'General public',
    tone: brandData?.brandVoice || dna.tone || 'Engaging',
    pillars: brandData?.contentPillars || ['Value', 'Connection', 'Authority']
  };
};

/**
 * Handle fetch response with basic error checking.
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API error (${response.status}): ${errorText || response.statusText}`);
  }
  return response.json();
};

/**
 * Direct call helper
 */
const callGroqDirectly = async (prompt) => {
  const res = await fetch(DIRECT_TEXT_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 1,
      top_p: 1,
      max_tokens: 1024,
    }),
  });
  
  if (!res.ok) throw new Error('Direct text generation failed');
  const data = await res.json();
  const content = data.choices[0].message.content;
  const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
};

export const generateContentIdeas = async (brandData, existingHooks = [], context = {}) => {
  try {
    const info = extractBrandInfo(brandData);
    let data;
    if (useProxy) {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'hooks',
          brandName: info.name,
          niche: info.niche,
          audience: info.audience,
          tone: info.tone,
          pillars: info.pillars,
          existingHooks
        })
      });
      const raw = await handleResponse(response);
      // Proxy wraps arrays as { data: [...], _meta } to preserve array type
      data = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
    } else {
      const avoidHooks = existingHooks && existingHooks.length > 0 
        ? `\nDO NOT use or repeat any of these previously generated hooks:\n${JSON.stringify(existingHooks)}` 
        : '';
        
      const prompt = `
        ROLE: Elite brand strategist and social media copywriter.
        CONTEXT: Generate viral content hooks for a brand.
        BRAND DETAILS:
        - Name: ${info.name}
        - Niche: ${info.niche}
        - Target Audience: ${info.audience}
        - Tone of Voice: ${info.tone}
        - Content Pillars: ${JSON.stringify(info.pillars)}

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
      data = await callGroqDirectly(prompt);
    }
    
    persistGeneration('hooks', data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error generating content ideas:', error);
    return [];
  }
};

export const generateCaptions = async (brandData, topic) => {
  try {
    const info = extractBrandInfo(brandData);
    let data;
    if (useProxy) {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'captions',
          topic,
          brandName: info.name,
          niche: info.niche,
          tone: info.tone
        })
      });
      const raw = await handleResponse(response);
      // Proxy wraps arrays as { data: [...], _meta } to preserve array type
      data = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
    } else {
      const prompt = `
        ROLE: Elite social media manager and copywriter.
        CONTEXT: Generate exactly 3 caption variations for a social media post about this topic: "${topic}".
        BRAND DETAILS:
        - Name: ${info.name}
        - Niche: ${info.niche}
        - Tone of Voice: ${info.tone}

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
      data = await callGroqDirectly(prompt);
    }
    
    persistGeneration('captions', data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error generating captions:', error);
    return [];
  }
};


/**
 * Generate relevant hashtags.
 */
export const generateHashtags = async (niche, context = {}) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'hashtags',
        niche,
        topic: context.topic
      })
    });
    
    const data = await handleResponse(response);
    persistGeneration('hashtags', data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error generating hashtags:', error);
    return [];
  }
};

export const generateHashtagStrategy = async (brandData) => {
  try {
    const info = extractBrandInfo(brandData);
    let data;
    if (useProxy) {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'hashtag_strategy',
          brandName: info.name,
          niche: info.niche,
          tone: info.tone
        })
      });
      data = await handleResponse(response);
    } else {
      const prompt = `
        ROLE: Elite Instagram Strategist.
        CONTEXT: Generate a hashtag strategy for this brand.
        BRAND DETAILS:
        - Name: ${info.name}
        - Niche: ${info.niche}
        - Tone of Voice: ${info.tone}

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
      data = await callGroqDirectly(prompt);
    }
    
    persistGeneration('hashtag_strategy', data);
    return data && typeof data === 'object' ? data : null;
  } catch (error) {
    console.error('Error generating hashtag strategy:', error);
    return null;
  }
};

export const refineWithBrandVoice = async (brandData, roughText) => {
  try {
    const info = extractBrandInfo(brandData);
    let data;
    if (useProxy) {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'refine_voice',
          brandName: info.name,
          voice: info.tone,
          niche: info.niche,
          roughText
        })
      });
      data = await handleResponse(response);
    } else {
      const prompt = `
        ROLE: Elite copywriter.
        CONTEXT: Refine this rough text to perfectly match the brand's tone of voice.
        BRAND DETAILS:
        - Name: ${info.name}
        - Niche: ${info.niche}
        - Tone of Voice: ${info.tone}
        
        ROUGH TEXT:
        "${roughText}"

        TASK: Rewrite the rough text above. Enhance it to match the brand Tone of Voice precisely. Do not add conversational filler.
        OUTPUT FORMAT: Return valid JSON ONLY.
        {
          "result": "Your polished and refined text here."
        }
      `.trim();
      data = await callGroqDirectly(prompt);
    }
    
    const result = data?.result || data;
    persistGeneration('refine_voice', result);
    return typeof result === 'string' ? result : '';
  } catch (error) {
    console.error('Error refining brand voice:', error);
    return 'Failed to refine text. Please try again.';
  }
};

export const generateTemplates = async (brandData) => {
  const info = extractBrandInfo(brandData);
  const niche = info.niche;
  const tone = info.tone;
  const name = info.name;

  try {
    let data;
    if (useProxy) {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'templates',
          brandName: name,
          niche,
          tone
        })
      });
      data = await handleResponse(response);
    } else {
      const prompt = `
        ROLE: Elite copywriter.
        CONTEXT: Generate 6 short texts for visual social media templates.
        BRAND: Name: ${name}, Niche: ${niche}, Tone: ${tone}.
        
        OUTPUT FORMAT: Return valid JSON ONLY matching exactly this structure:
        {
          "quote1": "A short, powerful inspirational quote matching the tone and niche.",
          "reel": "Short punchy 2-4 word title for a masterclass cover.",
          "story": "Short 2 word title for a resources highlight.",
          "carousel": "A 'X Ways to [Achievement]' hook related to the niche. Example: 3 Ways to Elevate Your [Niche] Output ->",
          "educational": "A short sentence teaching a core concept of the niche.",
          "quote2": "Another punchy bold statement matching the brand vibe."
        }
      `.trim();
      data = await callGroqDirectly(prompt);
    }
    
    if (data && data.quote1) {
      return [
        { id: 1, type: 'quote', name: 'Daily Inspiration', text: data.quote1 },
        { id: 2, type: 'reel_cover', name: 'The Masterclass', text: data.reel.toUpperCase() },
        { id: 3, type: 'story', name: 'Quick Tip', text: data.story.toUpperCase() },
        { id: 4, type: 'carousel', name: 'Value Swipe', text: data.carousel },
        { id: 5, type: 'educational', name: 'Pro Wisdom', text: data.educational },
        { id: 6, type: 'quote', name: 'Bold Statement', text: data.quote2 }
      ];
    }
  } catch (error) {
    console.error('Error generating template texts:', error);
  }

  // Fallback deterministic generation
  return [
    { id: 1, type: 'quote', name: 'Daily Inspiration', text: 'The ultimate expression of simplicity is sophistication.' },
    { id: 2, type: 'reel_cover', name: 'The Masterclass', text: 'THE BRAND BLUEPRINT' },
    { id: 3, type: 'story', name: 'Quick Tip', text: 'BRAND RESOURCES' },
    { id: 4, type: 'carousel', name: 'Value Swipe', text: `3 Ways to Elevate Your ${niche.split(' ')[0]} Output →` },
    { id: 5, type: 'educational', name: 'Pro Wisdom', text: `How to maintain consistency in your ${niche} journey.` },
    { id: 6, type: 'quote', name: 'Bold Statement', text: 'Design is intelligence made visible.' }
  ];
};

/**
 * Generate a brand identity persona.
 */
export const generateBrandIdentity = async (brandData) => {
  // Mock if needed by other components
  return { persona: brandData?.brandArchetype || 'The Visionary' };
};
