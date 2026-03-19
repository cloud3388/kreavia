/**
 * nvidiaService.js
 * Image Generation via NVIDIA AI API (Stable Diffusion XL)
 *
 * Model: stabilityai/stable-diffusion-xl
 * Docs: https://build.nvidia.com/stabilityai/stable-diffusion-xl
 * API:  https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl
 *
 * Two modes:
 *   1. DIRECT  — calls NVIDIA API from browser (dev/testing only, exposes key)
 *   2. PROXY   — calls your backend /api/generate/image (recommended for production)
 *
 * Set VITE_USE_AI_PROXY=true in .env to use proxy mode.
 * Set VITE_NVIDIA_API_KEY in .env for direct mode (key starts with "nvapi-").
 *
 * Fallback: Returns a placehold.co image URL when no API key is configured.
 */

const NVIDIA_API_URL = '/nvidia-api/v1/genai/stabilityai/stable-diffusion-xl';
const PROXY_URL      = '/api/generate/image';

const apiKey   = import.meta.env.VITE_NVIDIA_API_KEY;
const useProxy = import.meta.env.VITE_USE_AI_PROXY === 'true';
const isMock   = !apiKey && !useProxy;

// ──────────────────────────────────────────
// Build NVIDIA SDXL request body
// ──────────────────────────────────────────
const buildNvidiaInput = (prompt, options = {}) => ({
  text_prompts: [
    { text: prompt,                      weight: 1  },
    { text: options.negativePrompt || 'blurry, low quality, watermark, text overlay, ugly, deformed, noisy, pixelated', weight: -1 },
  ],
  sampler:       options.sampler      || 'K_EULER',
  steps:         options.steps        || 25,
  cfg_scale:     options.guidanceScale || 7.5,
  seed:          options.seed         || 0,          // 0 = random
  width:         options.width        || 1024,
  height:        options.height       || 1024,
});

// ──────────────────────────────────────────
// Direct NVIDIA API call
// ──────────────────────────────────────────
const callNvidiaDirect = async (prompt, options = {}) => {
  const response = await fetch(NVIDIA_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
      'Accept':        'application/json',
    },
    body: JSON.stringify(buildNvidiaInput(prompt, options)),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`NVIDIA API error: ${err.detail || response.statusText}`);
  }

  const result = await response.json();

  // NVIDIA returns: { artifacts: [{ base64: "...", finishReason: "SUCCESS" }] }
  const artifact = result?.artifacts?.[0];
  if (!artifact?.base64) throw new Error('NVIDIA API returned no image data');

  // Convert base64 to a data URL the browser can display
  return `data:image/png;base64,${artifact.base64}`;
};

// ──────────────────────────────────────────
// Proxy call (production — hides API key)
// ──────────────────────────────────────────
const callProxy = async (prompt, options = {}) => {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      provider: 'nvidia',
      model:    'stable-diffusion-xl',
      input:    buildNvidiaInput(prompt, options),
    }),
  });

  if (!response.ok) throw new Error(`Proxy error: ${response.statusText}`);
  const { imageUrl } = await response.json();
  return imageUrl;
};

// ──────────────────────────────────────────
// Mock fallback placeholder
// ──────────────────────────────────────────
const mockImage = (prompt, width = 400, height = 400) => {
  const words = prompt.split(' ').filter(w => w.length > 3);
  const label = words[0]?.toUpperCase()?.substring(0, 4) || 'IMG';
  return `https://placehold.co/${width}x${height}/0F0F0F/C6A96B?text=${label}&font=playfair`;
};

// ──────────────────────────────────────────
// Public API
// ──────────────────────────────────────────

/**
 * Generate an image from a text prompt using NVIDIA SDXL.
 * @param {string} prompt   - Text prompt for image generation
 * @param {object} options  - Optional: { width, height, steps, guidanceScale, negativePrompt, seed }
 * @returns {Promise<string>} - Data URL (base64) or fallback placeholder URL
 */
export const generateImage = async (prompt, options = {}) => {
  console.log(`[NVIDIA] Generating image. Mode: ${isMock ? 'MOCK' : useProxy ? 'PROXY' : 'DIRECT'}`);
  console.log(`[NVIDIA] Prompt: ${prompt.substring(0, 80)}...`);

  if (isMock) {
    console.warn('[NVIDIA] No API key found — returning mock image. Set VITE_NVIDIA_API_KEY to enable real generation.');
    await new Promise(r => setTimeout(r, 1500)); // Simulate latency
    return mockImage(prompt, options.width || 400, options.height || 400);
  }

  try {
    const url = useProxy
      ? await callProxy(prompt, options)
      : await callNvidiaDirect(prompt, options);

    if (!url) throw new Error('API returned empty output');

    console.log('[NVIDIA] Image generated successfully.');
    return url;
  } catch (err) {
    console.error(`[NVIDIA] Generation failed: ${err.message}. Falling back to placeholder.`);
    return mockImage(prompt, options.width || 400, options.height || 400);
  }
};

/**
 * Generate multiple logo variations in parallel.
 * @param {string[]} prompts - Array of prompts (one per logo style)
 * @param {object}   options - Generation options
 * @returns {Promise<string[]>} - Array of image URLs / data URLs
 */
export const generateLogoVariations = async (prompts, options = {}) =>
  Promise.all(prompts.map(p => generateImage(p, { ...options, width: 1024, height: 1024 })));

/**
 * Generate a social media template background image.
 * @param {string} prompt  - Creative direction prompt
 * @param {string} format  - 'square' | 'portrait' | 'landscape' | 'story'
 * @returns {Promise<string>} - Image URL / data URL
 */
export const generateTemplateBackground = async (prompt, format = 'square') => {
  const dimensions = {
    square:    { width: 1024, height: 1024 },
    portrait:  { width: 1024, height: 1280 },
    landscape: { width: 1280, height: 720  },
    story:     { width: 1024, height: 1820 },
  };

  const { width, height } = dimensions[format] || dimensions.square;
  return generateImage(prompt, {
    width,
    height,
    steps:         20,
    guidanceScale: 7,
    negativePrompt: 'text, watermark, logo, people, faces, blurry, low quality',
  });
};

export { buildNvidiaInput, isMock };
