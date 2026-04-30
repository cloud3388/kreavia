/**
 * api/generate-image.js
 * Vercel Serverless Function — NVIDIA AI API Proxy
 *
 * Proxies image generation requests from the browser to the NVIDIA API.
 * This keeps the API key server-side only and avoids CORS issues.
 *
 * Required Vercel environment variable:
 *   NVIDIA_API_KEY=nvapi-xxxxxxxxxxxx  (set in Vercel dashboard, NOT prefixed with VITE_)
 */

const NVIDIA_API_URL = 'https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-3-medium';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.NVIDIA_API_KEY || process.env.VITE_NVIDIA_API_KEY;
  if (!apiKey || apiKey.startsWith('nvapi-YOUR')) {
    return res.status(500).json({ 
      error: 'NVIDIA_API_KEY or VITE_NVIDIA_API_KEY not configured in Vercel environment.' 
    });
  }

  try {
    const nvidiaRes = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!nvidiaRes.ok) {
      const err = await nvidiaRes.json().catch(() => ({}));
      return res.status(nvidiaRes.status).json({
        error: `NVIDIA API error: ${err.detail || nvidiaRes.statusText}`,
      });
    }

    const data = await nvidiaRes.json();

    // Return base64 image data URL
    const base64 = data?.image || data?.artifacts?.[0]?.base64 || null;
    if (!base64) {
      console.error('[generate-image] No image data. Response:', JSON.stringify(data).slice(0, 300));
      return res.status(500).json({ error: 'No image data returned from NVIDIA API' });
    }

    return res.status(200).json({ imageUrl: `data:image/png;base64,${base64}` });
  } catch (err) {
    console.error('[generate-image] Proxy error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
