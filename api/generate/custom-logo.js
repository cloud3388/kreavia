/**
 * api/generate/custom-logo.js
 * Generates a logo using a user-provided custom prompt via NVIDIA SD3 API.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, brandName, palette } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  const nvidKey = process.env.NVIDIA_API_KEY;
  if (!nvidKey) {
    return res.status(500).json({ error: 'Missing NVIDIA_API_KEY in environment' });
  }

  const primary = palette?.primary || '#1A1A1A';
  const accent  = palette?.accent  || '#C6A96B';
  const name    = brandName || 'Brand';

  const fullPrompt = `${prompt}. Logo for "${name}". Vector art, flat design, centered on solid ${primary} background, logo mark in ${accent}, perfectly symmetrical, premium, Dribbble aesthetic, whitespace, corporate identity.`;
  const negativePrompt = '3d, detailed, realistic, photography, shadows, gradients, mockup, text, watermark, messy, uneven, noise, complex background';

  console.log('[custom-logo] Calling NVIDIA SD3. Prompt:', fullPrompt.slice(0, 120));

  let response;
  try {
    response = await fetch('https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-3-medium', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${nvidKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        negative_prompt: negativePrompt,
        cfg_scale: 8,
        steps: 28,
        aspect_ratio: '1:1',
      }),
    });
  } catch (fetchErr) {
    console.error('[custom-logo] Network error:', fetchErr.message);
    return res.status(502).json({ error: `Network error reaching NVIDIA: ${fetchErr.message}` });
  }

  if (!response.ok) {
    const errBody = await response.text();
    console.error('[custom-logo] NVIDIA error', response.status, ':', errBody);
    return res.status(response.status).json({
      error: `NVIDIA API error ${response.status}: ${errBody.slice(0, 300)}`,
    });
  }

  const data = await response.json();
  console.log('[custom-logo] NVIDIA response keys:', Object.keys(data));

  // Handle both response shapes:
  //  - SD3 NIM:     { artifacts: [{ base64: "..." }] }
  //  - Some builds: { image: "base64string" }
  const base64Image = data.artifacts?.[0]?.base64 || data.image || null;

  if (!base64Image) {
    console.error('[custom-logo] No image in response:', JSON.stringify(data).slice(0, 300));
    return res.status(500).json({
      error: 'NVIDIA returned no image. Response: ' + JSON.stringify(data).slice(0, 200),
    });
  }

  return res.status(200).json({
    url: `data:image/png;base64,${base64Image}`,
    model_used: 'nvidia-sd3',
  });
}
