import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { dna, palette, isAlternative, brandKitId, userId } = req.body;
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

  const nvidiaKey = process.env.VITE_NVIDIA_API_KEY || process.env.NVIDIA_API_KEY;
  if (!nvidiaKey) {
    console.error('[logo-gen] Missing NVIDIA API Key');
    return res.status(200).json(fallbackResponse);
  }

  // 1. Build Base Concept dynamically based on Niche
  const niche = (dna.niche || '').toLowerCase();
  let baseConcept = '';
  
  if (niche.includes('fitness')) {
    baseConcept = 'athletic shield, lightning bolt, dynamic figure in motion';
  } else if (niche.includes('lifestyle')) {
    baseConcept = 'minimal leaf, sun ray, flowing ribbon, abstract organic shape';
  } else if (niche.includes('fashion')) {
    baseConcept = 'geometric diamond, crown, elegant abstract shape, fashion silhouette';
  } else if (niche.includes('technology') || niche.includes('tech')) {
    baseConcept = 'circuit node, hexagon, abstract connected dots, geometric tech shape';
  } else if (niche.includes('food') || niche.includes('drink')) {
    baseConcept = 'abstract bowl, leaf sprig, fork silhouette, organic drop shape';
  } else if (niche.includes('business')) {
    baseConcept = 'abstract upward arrow, geometric mountain peak, interlocked shapes';
  } else if (niche.includes('gaming')) {
    baseConcept = 'controller silhouette, pixel star, geometric game icon';
  } else if (niche.includes('real estate')) {
    baseConcept = 'abstract roof line, geometric house shape, key silhouette';
  } else if (niche.includes('travel')) {
    baseConcept = 'compass rose, abstract plane shape, mountain peak, globe outline';
  } else {
    baseConcept = 'clean geometric abstract mark, minimal professional icon';
  }

  // 2. Build final prompt
  const styleStr = (dna.style || 'Premium').toLowerCase();
  let prompt = `A single minimalist vector logo icon of ${baseConcept}. ${dna.style} aesthetic design. Flat clean design, single color on pure white background, centered composition, no text, no letters, no words anywhere in the image, professional brand mark, scalable icon, thick clean outlines, simple geometric shapes only.`;

  if (styleStr.includes('luxury')) {
    prompt += ' thin elegant lines, sophisticated, timeless, high-end';
  } else if (styleStr.includes('minimal')) {
    prompt += ' maximum negative space, ultra clean, simple single shape';
  } else if (styleStr.includes('bold')) {
    prompt += ' thick strokes, strong geometric, high impact, powerful';
  } else if (styleStr.includes('playful')) {
    prompt += ' rounded corners, friendly curves, soft approachable design';
  } else if (styleStr.includes('dark aesthetic')) {
    prompt += ' sleek sharp edges, mysterious, editorial, dark energy';
  }

  if (isAlternative) {
    prompt += ' Alternative concept, different approach, unique interpretation.';
  }

  // 3. Setup Supabase
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  // Use Service Role Key if available, else Anon Key, since uploading via api might bypass RLS
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

  try {
    // Generate Image via NVIDIA NIM — Flux.2 Klein 4B (faster, cheaper than flux-1-dev)
    const apiUrl = 'https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux-2-klein-4b';
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nvidiaKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        width: 1024,
        height: 1024,
        num_inference_steps: 4,
        guidance_scale: 3.5,
        seed: Math.floor(Math.random() * 9999) + 1,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[logo-gen] NVIDIA Flux Klein Error:', err);
      return res.status(200).json(fallbackResponse);
    }

    const data = await response.json();
    
    // The response could be in a few formats based on the API. Flux via NIM usually returns data.artifacts
    let base64Image = '';
    
    if (data.artifacts && data.artifacts.length > 0 && data.artifacts[0].base64) {
      base64Image = data.artifacts[0].base64;
    } else if (data.image) {
      base64Image = data.image; // Some proxy versions use this structure
    }

    if (!base64Image) {
      throw new Error('No base64 image returned from NVIDIA API');
    }

    // 5. Save to Supabase Storage if configured
    let finalLogoUrl = `data:image/png;base64,${base64Image}`;

    if (supabase) {
      // Create bucket if not exists (Requires admin privileges or public insert permissions)
      try {
         await supabase.storage.createBucket('brand-logos', { public: true });
      } catch (e) {
         // Bucket might already exist or we lack permissions to create (RLS), ignore
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(base64Image, 'base64');
      const uId = userId || 'anon';
      const bId = brandKitId || 'draft';
      const timestamp = Date.now();
      const fileName = `${uId}-${bId}-${timestamp}.png`;

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('brand-logos')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase
          .storage
          .from('brand-logos')
          .getPublicUrl(fileName);
        
        if (publicUrlData && publicUrlData.publicUrl) {
          finalLogoUrl = publicUrlData.publicUrl;
          
          // Step 6. Save the public URL to brand_kits table logo_url column if we have a brandKitId
          if (brandKitId && brandKitId !== 'draft') {
            const { error: updateError } = await supabase
              .from('brand_kits')
              .update({ logo_url: finalLogoUrl })
              .eq('id', brandKitId);
              
            if (updateError) {
              console.error('[logo-gen] Failed to update brand_kits table:', updateError.message);
            }
          }
        }
      } else {
        console.error('[logo-gen] Supabase Storage upload error:', uploadError.message);
      }
    }

    return res.status(200).json({
      logos: [
        {
          style: 'symbol',
          url: finalLogoUrl,
          model_used: 'flux.2-klein-4b'
        }
      ]
    });
  } catch (error) {
    console.error('[logo-gen] Failed:', error);
    return res.status(200).json(fallbackResponse);
  }
}
