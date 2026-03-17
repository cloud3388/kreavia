/**
 * cache.js
 * In-memory + Supabase-backed generation cache.
 *
 * Prevents regenerating identical niche+style combos.
 * Cache key: dnaCacheKey() from brandDNA.js
 *
 * Strategy:
 *   1. Check in-memory cache (instant, session-scoped)
 *   2. Check Supabase brand_palette_cache table (cross-session)
 *   3. On miss: generate + save to both
 */
import { supabase, isMockMode } from '../lib/supabase';

// ──────────────────────────────────────────
// In-memory L1 cache (current session only)
// ──────────────────────────────────────────
const L1_CACHE = new Map();
const L1_TTL_MS = 30 * 60 * 1000; // 30 minutes

const l1Get = (key) => {
  const entry = L1_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > L1_TTL_MS) { L1_CACHE.delete(key); return null; }
  return entry.data;
};

const l1Set = (key, data) => {
  L1_CACHE.set(key, { data, ts: Date.now() });
};

// ──────────────────────────────────────────
// Supabase L2 cache (cross-session)
// ──────────────────────────────────────────
const l2Get = async (cacheKey, generationType) => {
  if (isMockMode || !supabase) return null;
  const { data, error } = await supabase
    .from('brand_palette_cache')
    .select('result_data, created_at')
    .eq('cache_key', cacheKey)
    .eq('generation_type', generationType)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  // Expire cache entries older than 7 days
  const age = Date.now() - new Date(data.created_at).getTime();
  if (age > 7 * 24 * 60 * 60 * 1000) return null;

  return data.result_data;
};

const l2Set = async (cacheKey, generationType, resultData) => {
  if (isMockMode || !supabase) return;
  await supabase.from('brand_palette_cache').upsert({
    cache_key: cacheKey,
    generation_type: generationType,
    result_data: resultData,
    created_at: new Date().toISOString(),
  }, { onConflict: 'cache_key,generation_type' });
};

// ──────────────────────────────────────────
// Public API
// ──────────────────────────────────────────

/**
 * Get a cached result — checks L1 first, then L2
 * @param {string} cacheKey   - from dnaCacheKey(dna)
 * @param {string} generationType - e.g. 'brand_palette'
 */
export const getCached = async (cacheKey, generationType) => {
  const l1Key = `${generationType}::${cacheKey}`;

  // L1 hit
  const l1 = l1Get(l1Key);
  if (l1) { console.log(`[Cache] L1 hit: ${l1Key}`); return l1; }

  // L2 hit
  const l2 = await l2Get(cacheKey, generationType);
  if (l2) {
    console.log(`[Cache] L2 hit: ${l1Key}`);
    l1Set(l1Key, l2); // Promote to L1
    return l2;
  }

  return null;
};

/**
 * Store a result in both L1 and L2 cache
 */
export const setCached = async (cacheKey, generationType, resultData) => {
  const l1Key = `${generationType}::${cacheKey}`;
  l1Set(l1Key, resultData);
  await l2Set(cacheKey, generationType, resultData);
};

/**
 * Clear in-memory cache (useful for testing)
 */
export const clearL1Cache = () => L1_CACHE.clear();
