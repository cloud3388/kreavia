/**
 * brandKitService.js
 * Handles brand kit, logos, and color palettes.
 */
import { supabase, isMockMode } from '../lib/supabase';

const MOCK_BRAND_KIT = {
  id: 'mock-bk-001',
  project_id: 'mock-proj-001',
  logo_url: 'https://placehold.co/400x400/0F0F0F/C6A96B?text=B&font=playfair',
  primary_color: '#0F0F0F',
  secondary_color: '#F5F5F5',
  accent_color: '#C6A96B',
  font_heading: 'Playfair Display',
  font_body: 'Inter',
  brand_voice: 'Luxury minimalist — sophisticated, direct, inspiring',
  brand_archetype: 'The Luxury Minimalist',
  brand_score: 92,
  logos: [
    { id: 'logo-1', style: 'monogram', image_url: 'https://placehold.co/400x400/0F0F0F/C6A96B?text=B&font=playfair', model_used: 'SDXL' },
    { id: 'logo-2', style: 'symbol',   image_url: 'https://placehold.co/400x400/0F0F0F/F5F5F5?text=✧&font=inter', model_used: 'SDXL' },
    { id: 'logo-3', style: 'wordmark', image_url: 'https://placehold.co/400x200/F5F5F5/0F0F0F?text=BRAND&font=playfair', model_used: 'SDXL' },
  ],
  color_palettes: [
    {
      id: 'palette-1',
      palette_name: 'Primary Palette',
      colors: [
        { hex_code: '#0F0F0F', role: 'primary' },
        { hex_code: '#F5F5F5', role: 'secondary' },
        { hex_code: '#C6A96B', role: 'accent' },
        { hex_code: '#6B7CFF', role: 'highlight' },
      ],
    },
  ],
};

export const getBrandKit = async (projectId) => {
  if (isMockMode) return { data: MOCK_BRAND_KIT, error: null };
  const { data: kit, error } = await supabase
    .from('brand_kits')
    .select(`
      *,
      logos(*),
      color_palettes(*, colors(*))
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return { data: kit, error };
};

export const createBrandKit = async (projectId, kitData) => {
  if (isMockMode) return { data: { ...MOCK_BRAND_KIT, ...kitData }, error: null };
  return supabase
    .from('brand_kits')
    .insert({ project_id: projectId, ...kitData })
    .select()
    .single();
};

export const saveLogo = async (brandKitId, { imageUrl, style, modelUsed }) => {
  if (isMockMode) return { data: { id: `logo-${Date.now()}`, brand_kit_id: brandKitId, image_url: imageUrl, style }, error: null };
  return supabase
    .from('logos')
    .insert({ brand_kit_id: brandKitId, image_url: imageUrl, style, model_used: modelUsed })
    .select()
    .single();
};

export const saveColorPalette = async (brandKitId, paletteName, colors) => {
  if (isMockMode) return { data: { id: `pal-${Date.now()}`, palette_name: paletteName, colors }, error: null };
  const { data: palette, error } = await supabase
    .from('color_palettes')
    .insert({ brand_kit_id: brandKitId, palette_name: paletteName })
    .select()
    .single();
  if (error || !palette) return { data: null, error };
  const colorRows = colors.map(c => ({ palette_id: palette.id, hex_code: c.hex_code, role: c.role }));
  const { error: colorError } = await supabase.from('colors').insert(colorRows);
  return { data: palette, error: colorError };
};
