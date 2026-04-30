/**
 * userService.js
 * Handles all user profile operations.
 * Falls back to mock data when Supabase is not configured.
 */
import { supabase, isMockMode } from '../lib/supabase';

const MOCK_USER = {
  id: 'mock-user-001',
  email: 'creator@example.com',
  username: 'luxurycreator',
  avatar_url: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  plan: 'free',
  credits: 3,
  created_at: new Date().toISOString(),
};

export const getUser = async (userId) => {
  if (isMockMode) return { data: MOCK_USER, error: null };
  return supabase.from('users').select('*').eq('id', userId).single();
};

export const updateUser = async (userId, updates) => {
  if (isMockMode) return { data: { ...MOCK_USER, ...updates }, error: null };
  return supabase.from('users').update(updates).eq('id', userId).select().single();
};

export const updateUsername = async (userId, username) =>
  updateUser(userId, { username });

export const updateAvatar = async (userId, avatarUrl) =>
  updateUser(userId, { avatar_url: avatarUrl });

// Deduct AI credits atomically
export const deductCredits = async (userId, amount = 1) => {
  if (isMockMode) {
    MOCK_USER.credits = Math.max(0, MOCK_USER.credits - amount);
    return { data: MOCK_USER, error: null };
  }
  return supabase.rpc('deduct_user_credits', { p_user_id: userId, p_amount: amount });
};

export const getUserPlan = async (userId) => {
  if (isMockMode) return { data: { plan: 'free', credits: 3 }, error: null };
  return supabase.from('users').select('plan, credits').eq('id', userId).single();
};

export const getUserSubscription = async (userId) => {
  if (isMockMode) return { data: null, error: null };
  return supabase.from('subscriptions').select('*').eq('user_id', userId).single();
};

export const checkGenerationLimit = async (userId) => {
  if (isMockMode) {
     const used = parseInt(localStorage.getItem('kreavia_gen_count') || '0', 10);
     return { used, remaining: Math.max(0, 3 - used) };
  }
  
  // Get start of current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  
  const { data, error } = await supabase
    .from('ai_usage')
    .select('credits_used')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth);
    
  if (error) return { used: 0, remaining: 3 };
  
  const used = data.reduce((sum, record) => sum + (record.credits_used || 1), 0);
  return { used, remaining: Math.max(0, 3 - used) };
};

export const recordGeneration = async (userId, type = 'brand_kit') => {
  if (isMockMode) {
     const used = parseInt(localStorage.getItem('kreavia_gen_count') || '0', 10);
     localStorage.setItem('kreavia_gen_count', (used + 1).toString());
     return { error: null };
  }
  return supabase.from('ai_usage').insert([
    { user_id: userId, generation_type: type, credits_used: 1 }
  ]);
};
