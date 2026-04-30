/**
 * templateService.js
 * CRUD for templates and their canvas elements.
 */
import { supabase, isMockMode } from '../lib/supabase';

const MOCK_TEMPLATES = [
  { id: 't1', project_id: 'mock-proj-001', name: 'Morning Aesthetic', type: 'instagram_post', preview_url: 'https://placehold.co/260x260/0F0F0F/C6A96B?text=Post', canvas_data: {}, created_at: new Date().toISOString() },
  { id: 't2', project_id: 'mock-proj-001', name: 'Reel Cover Vol.1', type: 'reel_cover', preview_url: 'https://placehold.co/260x260/1A1A1A/F5F5F5?text=Reel', canvas_data: {}, created_at: new Date().toISOString() },
  { id: 't3', project_id: 'mock-proj-001', name: 'Story Highlight', type: 'story', preview_url: 'https://placehold.co/260x260/111/C6A96B?text=Story', canvas_data: {}, created_at: new Date().toISOString() },
  { id: 't4', project_id: 'mock-proj-001', name: 'Carousel Slide', type: 'carousel', preview_url: 'https://placehold.co/260x260/0A0A0A/6B7CFF?text=Slide', canvas_data: {}, created_at: new Date().toISOString() },
];

export const getTemplates = async (projectId, type = null) => {
  if (isMockMode) {
    const filtered = type ? MOCK_TEMPLATES.filter(t => t.type === type) : MOCK_TEMPLATES;
    return { data: filtered, error: null };
  }
  let q = supabase.from('templates').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
  if (type) q = q.eq('type', type);
  return q;
};

export const getTemplate = async (templateId) => {
  if (isMockMode) {
    const t = MOCK_TEMPLATES.find(t => t.id === templateId) || MOCK_TEMPLATES[0];
    return { data: { ...t, template_elements: [] }, error: null };
  }
  return supabase
    .from('templates')
    .select('*, template_elements(*)')
    .eq('id', templateId)
    .single();
};

export const createTemplate = async (projectId, { name, type, canvasData = {}, previewUrl = null }) => {
  if (isMockMode) {
    const t = { id: `t-${Date.now()}`, project_id: projectId, name, type, canvas_data: canvasData, preview_url: previewUrl, created_at: new Date().toISOString() };
    MOCK_TEMPLATES.push(t);
    return { data: t, error: null };
  }
  return supabase
    .from('templates')
    .insert({ project_id: projectId, name, type, canvas_data: canvasData, preview_url: previewUrl })
    .select()
    .single();
};

export const updateTemplateCanvas = async (templateId, canvasData) => {
  if (isMockMode) return { data: { canvas_data: canvasData }, error: null };
  return supabase.from('templates').update({ canvas_data: canvasData }).eq('id', templateId).select().single();
};

export const deleteTemplate = async (templateId) => {
  if (isMockMode) return { error: null };
  return supabase.from('templates').delete().eq('id', templateId);
};

export const duplicateTemplate = async (templateId) => {
  const { data: original, error } = await getTemplate(templateId);
  if (error) return { data: null, error };
  return createTemplate(original.project_id, {
    name: `${original.name} (Copy)`,
    type: original.type,
    canvasData: original.canvas_data,
    previewUrl: original.preview_url,
  });
};

// Template Elements
export const addElement = async (templateId, { type, properties, zIndex = 0 }) => {
  if (isMockMode) return { data: { id: `el-${Date.now()}`, template_id: templateId, type, properties, z_index: zIndex }, error: null };
  return supabase
    .from('template_elements')
    .insert({ template_id: templateId, type, properties, z_index: zIndex })
    .select()
    .single();
};

export const updateElement = async (elementId, properties) => {
  if (isMockMode) return { data: { id: elementId, properties }, error: null };
  return supabase.from('template_elements').update({ properties }).eq('id', elementId).select().single();
};

export const deleteElement = async (elementId) => {
  if (isMockMode) return { error: null };
  return supabase.from('template_elements').delete().eq('id', elementId);
};
