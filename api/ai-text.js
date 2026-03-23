/**
 * api/ai-text.js
 * Vercel Serverless Function — NVIDIA Chat API Proxy
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

  const { dna, type = 'post' } = req.body;

  const prompt = `
    ROLE: Elite brand strategist and SDXL prompt engineer.
    CONTEXT: Brand DNA: ${JSON.stringify(dna)}
    TASK: Generate social media content for a ${type}.
    
    REQUIREMENTS:
    1. Caption: Engaging, matches brand tone, under 150 chars.
    2. Tagline: Punchy, memorable, fits brand personality.
    3. Image Prompt: Highly detailed SDXL prompt. Describe lighting, style (e.g. ${dna.style}), and subject. No text in image.
    
    OUTPUT FORMAT: Return valid JSON only.
    {
      "caption": "...",
      "tagline": "...",
      "imagePrompt": "..."
    }
  `.trim();

  try {
    const groqRes = await fetch(GROQ_TEXT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 1,
        top_p: 1,
        max_tokens: 1024,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.json().catch(() => ({}));
      return res.status(groqRes.status).json({ error: `Groq API error: ${err.error?.message || groqRes.statusText}` });
    }

    const data = await groqRes.json();
    const content = data.choices[0].message.content;
    
    // Attempt to extract JSON if the model included extra text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

    return res.status(200).json(result);
  } catch (err) {
    console.error('[ai-text] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
