/**
 * contentService.js
 * Manages content ideas, captions, and hashtags.
 */
import { supabase, isMockMode } from '../lib/supabase';

// ──────────────────────────────────────────
// CONTENT IDEAS
// ──────────────────────────────────────────
const MOCK_IDEAS = [
  { id: 'i1', project_id: 'mock-proj-001', title: 'Things nobody tells you about the luxury lifestyle', content_type: 'reel', hook: 'Nobody talks about this...', is_saved: false },
  { id: 'i2', project_id: 'mock-proj-001', title: 'My highly requested morning routine (aesthetic version)', content_type: 'carousel', hook: 'You asked, I answered ✨', is_saved: true },
  { id: 'i3', project_id: 'mock-proj-001', title: '3 mistakes keeping you from your dream aesthetic', content_type: 'reel', hook: 'Stop doing this 🚫', is_saved: false },
];

export const getContentIdeas = async (projectId) => {
  if (isMockMode) return { data: MOCK_IDEAS, error: null };
  return supabase.from('content_ideas').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
};

export const saveContentIdea = async (projectId, { title, description, contentType, hook }) => {
  if (isMockMode) {
    const idea = { id: `i-${Date.now()}`, project_id: projectId, title, description, content_type: contentType, hook, is_saved: false };
    MOCK_IDEAS.push(idea);
    return { data: idea, error: null };
  }
  return supabase
    .from('content_ideas')
    .insert({ project_id: projectId, title, description, content_type: contentType, hook })
    .select()
    .single();
};

export const toggleSavedIdea = async (ideaId, isSaved) => {
  if (isMockMode) return { data: { id: ideaId, is_saved: isSaved }, error: null };
  return supabase.from('content_ideas').update({ is_saved: isSaved }).eq('id', ideaId).select().single();
};

// ──────────────────────────────────────────
// CAPTIONS
// ──────────────────────────────────────────
const MOCK_CAPTIONS = [
  { id: 'c1', project_id: 'mock-proj-001', caption_text: 'Less noise, more elegance.', tone: 'luxury', is_saved: true },
  { id: 'c2', project_id: 'mock-proj-001', caption_text: 'Building an empire quietly. 🕊️', tone: 'motivational', is_saved: false },
];

export const getCaptions = async (projectId, tone = null) => {
  if (isMockMode) {
    const filtered = tone ? MOCK_CAPTIONS.filter(c => c.tone === tone) : MOCK_CAPTIONS;
    return { data: filtered, error: null };
  }
  let q = supabase.from('captions').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
  if (tone) q = q.eq('tone', tone);
  return q;
};

export const saveCaption = async (projectId, captionText, tone) => {
  if (isMockMode) {
    const c = { id: `c-${Date.now()}`, project_id: projectId, caption_text: captionText, tone, is_saved: false };
    MOCK_CAPTIONS.push(c);
    return { data: c, error: null };
  }
  return supabase
    .from('captions')
    .insert({ project_id: projectId, caption_text: captionText, tone })
    .select()
    .single();
};

// ──────────────────────────────────────────
// HASHTAGS
// ──────────────────────────────────────────
const MOCK_HASHTAGS = [
  { id: 'h1', project_id: 'mock-proj-001', tag: '#luxurylifestyle', category: 'broad', reach_est: 1200000 },
  { id: 'h2', project_id: 'mock-proj-001', tag: '#creatorjourney', category: 'niche', reach_est: 450000 },
  { id: 'h3', project_id: 'mock-proj-001', tag: '#mindsetshift', category: 'trending', reach_est: 890000 },
  { id: 'h4', project_id: 'mock-proj-001', tag: '#aestheticfeed', category: 'niche', reach_est: 670000 },
  { id: 'h5', project_id: 'mock-proj-001', tag: '#brandidentity', category: 'niche', reach_est: 320000 },
];

export const getHashtags = async (projectId) => {
  if (isMockMode) return { data: MOCK_HASHTAGS, error: null };
  return supabase.from('hashtags').select('*').eq('project_id', projectId).order('reach_est', { ascending: false });
};

export const saveHashtags = async (projectId, tags) => {
  if (isMockMode) return { data: tags, error: null };
  const rows = tags.map(t => ({ project_id: projectId, ...t }));
  return supabase.from('hashtags').insert(rows).select();
};

export const deleteHashtag = async (hashtagId) => {
  if (isMockMode) return { error: null };
  return supabase.from('hashtags').delete().eq('id', hashtagId);
};
