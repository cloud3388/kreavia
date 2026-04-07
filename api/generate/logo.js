export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { dna, palette, isAlternative } = req.body;
  if (!dna || !palette) {
    return res.status(400).json({ error: 'Missing dna or palette' });
  }

  const primary = palette.primary || '#1A1A1A';
  const accent = palette.accent || '#C6A96B';
  const name = dna.brand_name || 'Brand';
  const fallbackResponse = {
    logos: [
      { 
         style: 'symbol', 
         url: `https://placehold.co/400x400/${primary.replace('#', '')}/${accent.replace('#', '')}?text=${name[0].toUpperCase()}&font=playfair`,
         model_used: 'fallback'
      }
    ]
  };

  const recraftKey = process.env.VITE_RECRAFT_API_KEY || process.env.RECRAFT_API_KEY;
  if (!recraftKey) {
    console.error('[logo-gen] Missing Recraft API Key');
    return res.status(200).json(fallbackResponse);
  }

  let prompt = `Minimal professional logo mark icon for a brand called ${name} in the ${dna.niche} space. Style: ${dna.style}. Target audience: ${dna.audience}.

Design direction based on style:
- If style is Luxury: elegant monogram or abstract geometric mark, thin lines, sophisticated, timeless
- If style is Minimal: clean simple icon, single shape, lots of negative space, modern and flat
- If style is Bold: strong geometric shape, thick strokes, high contrast, powerful
- If style is Playful: rounded friendly icon, soft curves, approachable, fun
- If style is Dark Aesthetic: sleek dark icon, mysterious, editorial, sharp edges

The logo must be:
- A symbol or icon mark only
- No text or brand name inside the image
- Single color on white background
- Clean vector style
- Scalable and professional
- Centered on white canvas
- Suitable for Instagram profile picture`;

  if (isAlternative) {
    prompt += '\n\nAlternative concept, different approach, unique interpretation';
  }

  try {
    const response = await fetch('https://external.api.recraft.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${recraftKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        model: 'recraft-v3',
        style: 'vector_illustration',
        size: '1024x1024'
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[logo-gen] Recraft Error:', err);
      return res.status(200).json(fallbackResponse);
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;
    
    if (imageUrl) {
      return res.status(200).json({
        logos: [
          {
            style: 'symbol',
            url: imageUrl,
            model_used: 'recraft-v3'
          }
        ]
      });
    }

    throw new Error('No image returned from Recraft');
  } catch (error) {
    console.error('[logo-gen] Failed:', error);
    return res.status(200).json(fallbackResponse);
  }
}
