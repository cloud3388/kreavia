export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { dna, palette } = req.body;
  if (!dna || !palette) {
    return res.status(400).json({ error: 'Missing dna or palette' });
  }

  const nvidKey = process.env.VITE_NVIDIA_API_KEY || process.env.NVIDIA_API_KEY;
  if (!nvidKey) {
    return res.status(500).json({ error: 'Missing NVIDIA API Key' });
  }

  const primary = palette.primary || '#1A1A1A';
  const accent = palette.accent || '#C6A96B';
  const name = dna.brand_name || 'Brand';
  
  // Single crisp prompt for a high-end monogram or symbol logo
  const prompt = `A luxury minimalist logo design for ${name}. Niche: ${dna.niche}. 
Features a sleek monogram or abstract geometric symbol centered on a solid ${primary} background. 
The logo mark itself should be a luxurious ${accent} color. 
Vector art, flat design, perfectly symmetrical, whitespace, extremely premium, corporate identity, Dribbble aesthetic.`;

  try {
    const response = await fetch('https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-3-medium', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nvidKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        negative_prompt: '3d, detailed, realistic, photography, shadows, gradients, mockup, text, watermark, messy, uneven, noise',
        cfg_scale: 8,
        steps: 28,
        aspect_ratio: '1:1',
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[logo-gen] NVIDIA Error:', err);
      // Fallback response so frontend doesn't break
      return res.status(200).json({
        logos: [
          { 
             style: 'symbol', 
             url: `https://placehold.co/400x400/${primary.replace('#', '')}/${accent.replace('#', '')}?text=${name[0].toUpperCase()}&font=playfair`,
             model_used: 'fallback'
          }
        ]
      });
    }

    const data = await response.json();
    const base64Image = data.artifacts?.[0]?.base64;
    
    if (base64Image) {
      return res.status(200).json({
        logos: [
          {
            style: 'symbol',
            url: `data:image/png;base64,${base64Image}`,
            model_used: 'nvidia-sd3'
          }
        ]
      });
    }

    throw new Error('No image returned');
  } catch (error) {
    console.error('[logo-gen] Failed:', error);
    return res.status(200).json({
      logos: [
        { 
           style: 'symbol', 
           url: `https://placehold.co/400x400/${primary.replace('#', '')}/${accent.replace('#', '')}?text=${name[0].toUpperCase()}&font=playfair`,
           model_used: 'fallback'
        }
      ]
    });
  }
}
