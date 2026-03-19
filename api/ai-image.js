/**
 * api/ai-image.js
 * Vercel Serverless Function — NVIDIA SDXL Proxy
 */

const NVIDIA_IMAGE_URL = 'https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.NVIDIA_API_KEY || process.env.VITE_NVIDIA_API_KEY;
  if (!apiKey || apiKey.startsWith('nvapi-YOUR')) {
    return res.status(500).json({ error: 'NVIDIA_API_KEY not configured.' });
  }

  const { prompt, style = 'luxury' } = req.body;

  const body = {
    text_prompts: [
      { text: prompt, weight: 1.0 },
      { text: 'blurry, low quality, watermark, text, signature, deformed', weight: -1.0 }
    ],
    cfg_scale: 7,
    steps: 30,
    width: 1024,
    height: 1024,
  };

  try {
    const nvidiaRes = await fetch(NVIDIA_IMAGE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!nvidiaRes.ok) {
      const err = await nvidiaRes.json().catch(() => ({}));
      return res.status(nvidiaRes.status).json({ error: `NVIDIA API error: ${err.detail || nvidiaRes.statusText}` });
    }

    const data = await nvidiaRes.json();
    const base64 = data?.artifacts?.[0]?.base64;
    
    if (!base64) {
      return res.status(500).json({ error: 'No image data returned from NVIDIA' });
    }

    return res.status(200).json({ imageUrl: `data:image/png;base64,${base64}` });
  } catch (err) {
    console.error('[ai-image] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
