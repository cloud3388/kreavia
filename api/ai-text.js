/**
 * api/ai-text.js
 * Vercel Serverless Function — NVIDIA Chat API Proxy
 */

const NVIDIA_TEXT_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.NEMOTRON_API_KEY || process.env.VITE_NEMOTRON_API_KEY;
  if (!apiKey || apiKey.startsWith('nvapi-YOUR')) {
    return res.status(500).json({ error: 'NEMOTRON_API_KEY not configured.' });
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
    const nvidiaRes = await fetch(NVIDIA_TEXT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-super-120b-a12b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        top_p: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!nvidiaRes.ok) {
      const err = await nvidiaRes.json().catch(() => ({}));
      return res.status(nvidiaRes.status).json({ error: `NVIDIA API error: ${err.detail || nvidiaRes.statusText}` });
    }

    const data = await nvidiaRes.json();
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
