/**
 * projectService.js
 * CRUD operations for creator projects.
 */
import { supabase, isMockMode } from '../lib/supabase';

const MOCK_PROJECTS = [
  {
    id: 'mock-proj-001',
    user_id: 'mock-user-001',
    name: 'My Personal Brand',
    niche: 'lifestyle',
    audience: 'Entrepreneurs',
    style: 'luxury',
    created_at: new Date().toISOString(),
  },
];

export const getProjects = async (userId) => {
  if (isMockMode) return { data: MOCK_PROJECTS, error: null };
  return supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
};

export const getProject = async (projectId) => {
  if (isMockMode) return { data: MOCK_PROJECTS[0], error: null };
  return supabase.from('projects').select('*').eq('id', projectId).single();
};

export const createProject = async ({ userId, name, niche, audience, style }) => {
  if (isMockMode) {
    const proj = { id: `mock-proj-${Date.now()}`, user_id: userId, name, niche, audience, style, created_at: new Date().toISOString() };
    MOCK_PROJECTS.push(proj);
    return { data: proj, error: null };
  }
  return supabase
    .from('projects')
    .insert({ user_id: userId, name, niche, audience, style })
    .select()
    .single();
};

export const updateProject = async (projectId, updates) => {
  if (isMockMode) return { data: { ...MOCK_PROJECTS[0], ...updates }, error: null };
  return supabase.from('projects').update(updates).eq('id', projectId).select().single();
};

export const deleteProject = async (projectId) => {
  if (isMockMode) return { error: null };
  return supabase.from('projects').delete().eq('id', projectId);
};
