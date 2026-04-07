/**
 * sdxlService.js
 * SDXL Image Generation via Replicate API
 *
 * Model: stability-ai/sdxl  (sdxl-turbo for faster generations)
 * Docs: https://replicate.com/stability-ai/sdxl
 *
 * Two modes:
 *   1. DIRECT  — calls Replicate from browser (dev/testing only, exposes key)
 *   2. PROXY   — calls your backend /api/generate/image (recommended for production)
 *
 * Set VITE_USE_AI_PROXY=true in .env to use proxy mode.
 * Set VITE_REPLICATE_API_TOKEN in .env for direct mode.
 *
 * Fallback:  Returns a placehold.co image URL when no API key is configured.
 */

const REPLICATE_API = '/replicate/v1/predictions';
const PROXY_URL = '/api/generate/image';

// SDXL model versions on Replicate
const MODELS = {
  'sdxl':       '7762fd07cf82c948538e41f63f77d685e02b063e37291fae01d237f97508d1',
  'sdxl-turbo': 'da77bc59ee60423279fd632efb4795ab731d9e3ca9705ef3341091fb989b7eaf',
};

const apiToken  = import.meta.env.VITE_REPLICATE_API_TOKEN;
const useProxy  = import.meta.env.VITE_USE_AI_PROXY === 'true';
const isMock    = !apiToken && !useProxy;

// ──────────────────────────────────────────
// Build SDXL input parameters
// ──────────────────────────────────────────
const buildSdxlInput = (prompt, options = {}) => ({
  prompt,
  negative_prompt:   options.negativePrompt  || 'blurry, low quality, watermark, text overlay, ugly, deformed, noisy, pixelated, gradient background, busy background',
  width:             options.width           || 1024,
  height:            options.height          || 1024,
  num_inference_steps: options.steps         || 25,      // 25 = quality/speed balance
  guidance_scale:    options.guidanceScale   || 7.5,     // 7-8 for logos
  num_outputs:       options.numOutputs      || 1,
  scheduler:         options.scheduler       || 'K_EULER',
  refine:            options.refine          || 'expert_ensemble_refiner',
  high_noise_frac:   options.highNoiseFrac   || 0.8,
});

// ──────────────────────────────────────────
// Direct Replicate API call (dev only)
// ──────────────────────────────────────────
const callReplicateDirect = async (prompt, options = {}) => {
  const modelVersion = MODELS[options.model || 'sdxl-turbo'];

  const response = await fetch(REPLICATE_API, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: modelVersion,
      input: buildSdxlInput(prompt, options),
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Replicate API error: ${err.detail || response.statusText}`);
  }

  const prediction = await response.json();
  return pollPrediction(prediction.id);
};

// ──────────────────────────────────────────
// Poll prediction until complete
// ──────────────────────────────────────────
const pollPrediction = async (predictionId, maxAttempts = 60) => {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 1000)); // 1s interval

    const response = await fetch(`${REPLICATE_API}/${predictionId}`, {
      headers: { 'Authorization': `Token ${apiToken}` },
    });

    const prediction = await response.json();
    console.log(`[SDXL] Poll ${i + 1}: ${prediction.status}`);

    if (prediction.status === 'succeeded') {
      return prediction.output?.[0] || null;
    }
    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(`Image generation ${prediction.status}: ${prediction.error}`);
    }
  }
  throw new Error('Image generation timed out after 60 seconds');
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
      model: options.model || 'sdxl-turbo',
      input: buildSdxlInput(prompt, options),
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
  // Extract first meaningful word for placeholder text
  const words = prompt.split(' ').filter(w => w.length > 3);
  const label = words[0]?.toUpperCase()?.substring(0, 4) || 'IMG';
  return `https://placehold.co/${width}x${height}/0F0F0F/C6A96B?text=${label}&font=playfair`;
};

// ──────────────────────────────────────────
// Public API
// ──────────────────────────────────────────

/**
 * Generate an image from a text prompt using SDXL.
 * @param {string} prompt     - Text prompt for image generation
 * @param {object} options    - Optional: { model, width, height, steps, negativePrompt, numOutputs }
 * @returns {Promise<string>} - URL of generated image
 */
export const generateImage = async (prompt, options = {}) => {
  console.log(`[SDXL] Generating image. Mode: ${isMock ? 'MOCK' : useProxy ? 'PROXY' : 'DIRECT'}`);
  console.log(`[SDXL] Prompt: ${prompt.substring(0, 80)}...`);

  if (isMock) {
    console.warn('[SDXL] No API token found — returning mock image. Set VITE_REPLICATE_API_TOKEN to enable real generation.');
    await new Promise(r => setTimeout(r, 1500)); // Simulate latency
    return mockImage(prompt, options.width || 400, options.height || 400);
  }

  try {
    const url = useProxy
      ? await callProxy(prompt, options)
      : await callReplicateDirect(prompt, options);
    
    if (!url) throw new Error("API returned empty output");
    
    console.log(`[SDXL] Success! Image URL: ${url}`);
    return url;
  } catch (err) {
    console.error(`[SDXL] Generation failed: ${err.message}. Falling back to placeholder.`);
    return mockImage(prompt, options.width || 400, options.height || 400);
  }
};

/**
 * Generate multiple logo variations in parallel.
 * @param {string[]} prompts  - Array of prompts (one per logo style)
 * @param {object}   options  - SDXL options
 * @returns {Promise<string[]>} - Array of image URLs
 */
export const generateLogoVariations = async (prompts, options = {}) => {
  return Promise.all(prompts.map(p => generateImage(p, { ...options, width: 1024, height: 1024 })));
};

/**
 * Generate a social media template background image.
 * @param {string} prompt     - Creative direction prompt
 * @param {string} format     - 'square' | 'portrait' | 'landscape'
 * @returns {Promise<string>} - Image URL
 */
export const generateTemplateBackground = async (prompt, format = 'square') => {
  const dimensions = {
    square:    { width: 1080, height: 1080 },
    portrait:  { width: 1080, height: 1350 },
    landscape: { width: 1280, height: 720  },
    story:     { width: 1080, height: 1920 },
  };

  const { width, height } = dimensions[format] || dimensions.square;
  return generateImage(prompt, {
    width,
    height,
    steps: 20,             // Fewer steps = faster, sufficient for backgrounds
    guidanceScale: 7,
    negativePrompt: 'text, watermark, logo, people, faces, blurry, low quality',
  });
};

export { MODELS, buildSdxlInput, isMock };
